/**
 * 文件夹分享公开路由
 *
 * - 公开只读访问 target_type === 'folder' 的分享记录
 * - 目录浏览统一走存储驱动 READER 能力（MountManager.getDriver + listDirectory）
 * - 单文件下载走后端代理（StorageStreaming，SHARE 通道），成功后累计下载计数
 *
 * 安全约定：
 * - path 参数为“分享根目录相对路径”，禁止绝对路径与 `..` 越权段
 * - 所有驱动 subPath 均基于 record.storage_path 拼接，解析后不会超出分享根目录
 */

import { ApiStatus } from "../../constants/index.js";
import { AppError, NotFoundError, AuthenticationError, AuthorizationError, ValidationError } from "../../http/errors.js";
import { jsonOk } from "../../utils/common.js";
import { getEncryptionSecret } from "../../utils/environmentUtils.js";
import { useRepositories } from "../../utils/repositories.js";
import { verifyPassword } from "../../utils/crypto.js";
import { getFileBySlug, isFileAccessible } from "../../services/fileService.js";
import { checkAndDeleteExpiredFile } from "../../services/fileViewService.js";
import { MountManager } from "../../storage/managers/MountManager.js";
import { CAPABILITIES } from "../../storage/interfaces/capabilities/index.js";
import { StorageStreaming, STREAMING_CHANNELS } from "../../storage/streaming/index.js";
import { StorageFactory } from "../../storage/factory/StorageFactory.js";
import { getContentTypeAndDisposition } from "../../utils/fileUtils.js";

/**
 * 规范化“分享根目录相对路径”
 * - 统一分隔符为 `/`
 * - 拒绝绝对路径与包含 `..` 的越权路径
 * - 丢弃空段与 `.` 段
 * @param {unknown} input
 * @returns {string} 规范化后的相对路径（根目录返回空字符串）
 */
function normalizeRelPath(input) {
  if (input == null) return "";
  const raw = String(input).replace(/\\/g, "/").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) {
    throw new ValidationError("非法路径");
  }

  const segments = raw.split("/");
  const cleaned = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      throw new ValidationError("非法路径");
    }
    cleaned.push(segment);
  }
  return cleaned.join("/");
}

/**
 * 拼接完整存储子路径（分享根目录 + 相对路径）
 * - 统一去除 storage_path 首尾斜杠（与 ShareRecordService 写入约定一致）
 * @param {string} storagePath - 分享记录的 storage_path（目录前缀）
 * @param {string} relPath - 规范化后的相对路径
 * @returns {string}
 */
function joinStoragePath(storagePath, relPath) {
  const base = String(storagePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!relPath) return base;
  return base ? `${base}/${relPath}` : relPath;
}

/**
 * 加载并校验文件夹分享记录
 * @returns {Promise<Object>}
 */
async function loadFolderShare(db, slug, encryptionSecret) {
  const record = await getFileBySlug(db, slug, encryptionSecret);
  if (!record) {
    throw new NotFoundError("分享不存在");
  }
  if (record.target_type !== "folder") {
    throw new NotFoundError("分享不存在");
  }
  return record;
}

/**
 * 访问守卫：过期 / 达到下载上限时清理记录并返回 410
 */
async function ensureAccessible(db, record, encryptionSecret, repositoryFactory) {
  const access = await isFileAccessible(db, record, encryptionSecret);
  if (access.accessible) return;

  if (access.reason === "expired") {
    await checkAndDeleteExpiredFile(db, record, encryptionSecret, repositoryFactory);
    throw new AppError("分享已过期或已达下载次数上限", {
      status: ApiStatus.GONE,
      code: "GONE",
      expose: true,
    });
  }
  throw new AuthorizationError("分享不可访问");
}

/**
 * 密码守卫（仅在分享设置了密码时生效）
 */
async function ensurePassword(record, plainPassword) {
  if (!record.password) return;
  if (!plainPassword) {
    throw new AuthenticationError("需要密码访问");
  }
  const valid = await verifyPassword(plainPassword, record.password);
  if (!valid) {
    throw new AuthenticationError("密码不正确");
  }
}

/**
 * 将驱动返回的目录项归一化为稳定的对外契约结构
 * @param {Object} item - 驱动返回项
 * @param {string} relPath - 当前列的目录相对路径
 */
function normalizeItem(item, relPath) {
  const isDirectory = !!item?.isDirectory;
  const name = item?.name || "";
  const itemRelPath = relPath ? `${relPath}/${name}` : name;
  return {
    name,
    path: itemRelPath,
    isDirectory,
    size: isDirectory ? 0 : typeof item?.size === "number" && Number.isFinite(item.size) ? item.size : 0,
    modified_at: item?.modified || null,
  };
}

/**
 * 构造元信息负载（不含 items）
 */
function buildMetaPayload(record) {
  return {
    id: record.id,
    slug: record.slug,
    filename: record.filename,
    remark: record.remark,
    target_type: "folder",
    requires_password: !!record.password,
    expires_at: record.expires_at,
    max_views: record.max_views,
    views: record.views,
  };
}

/**
 * 列出分享根目录下某个相对目录的内容
 * @returns {Promise<{ path: string, items: Array<Object> }>}
 */
async function listFolder(db, record, encryptionSecret, repositoryFactory, relPath) {
  const pseudoMount = {
    id: record.id,
    storage_type: record.storage_type,
    storage_config_id: record.storage_config_id,
  };

  const mountManager = new MountManager(db, encryptionSecret, repositoryFactory);
  const driver = await mountManager.getDriver(pseudoMount);

  if (!driver.hasCapability(CAPABILITIES.READER)) {
    throw new AppError("当前存储不支持目录浏览", {
      status: 501,
      code: "NOT_IMPLEMENTED",
      expose: true,
    });
  }

  const fullSubPath = joinStoragePath(record.storage_path, relPath);
  // 驱动约定：目录 subPath 以 "/" 开头、以 "/" 结尾；根目录使用空字符串
  const driverSubPath = fullSubPath ? `/${fullSubPath}/` : "";
  const displayPath = relPath ? `/${relPath}` : "/";

  const result = await driver.listDirectory(driverSubPath, {
    path: displayPath,
    mount: pseudoMount,
    subPath: driverSubPath,
    db,
  });

  const items = Array.isArray(result?.items) ? result.items.map((item) => normalizeItem(item, relPath)) : [];
  return { path: relPath, items };
}

export const registerFolderPublicRoutes = (router) => {
  // 元信息（未设置密码时包含根目录列表）
  router.get("/api/share/folder/:slug", async (c) => {
    const db = c.env.DB;
    const slug = c.req.param("slug");
    const encryptionSecret = getEncryptionSecret(c);
    const repositoryFactory = useRepositories(c);

    const record = await loadFolderShare(db, slug, encryptionSecret);

    // 设置了密码：仅返回元信息，不暴露任何列表/URL
    if (record.password) {
      return jsonOk(c, { ...buildMetaPayload(record), path: "", items: null }, "需要密码访问");
    }

    await ensureAccessible(db, record, encryptionSecret, repositoryFactory);
    const listing = await listFolder(db, record, encryptionSecret, repositoryFactory, "");
    return jsonOk(c, { ...buildMetaPayload(record), path: listing.path, items: listing.items }, "获取分享成功");
  });

  // 校验密码并返回根目录列表
  router.post("/api/share/folder/verify/:slug", async (c) => {
    const db = c.env.DB;
    const slug = c.req.param("slug");
    const encryptionSecret = getEncryptionSecret(c);
    const repositoryFactory = useRepositories(c);

    const body = await c.req.json().catch(() => ({}));
    const plainPassword = body?.password;

    const record = await loadFolderShare(db, slug, encryptionSecret);
    await ensureAccessible(db, record, encryptionSecret, repositoryFactory);
    await ensurePassword(record, plainPassword);

    const listing = await listFolder(db, record, encryptionSecret, repositoryFactory, "");
    return jsonOk(c, { ...buildMetaPayload(record), path: listing.path, items: listing.items }, "密码验证成功");
  });

  // 子目录列表
  router.get("/api/share/folder/:slug/list", async (c) => {
    const db = c.env.DB;
    const slug = c.req.param("slug");
    const encryptionSecret = getEncryptionSecret(c);
    const repositoryFactory = useRepositories(c);

    const record = await loadFolderShare(db, slug, encryptionSecret);
    await ensureAccessible(db, record, encryptionSecret, repositoryFactory);
    await ensurePassword(record, c.req.query("password"));

    const relPath = normalizeRelPath(c.req.query("path"));
    const listing = await listFolder(db, record, encryptionSecret, repositoryFactory, relPath);
    return jsonOk(c, { ...buildMetaPayload(record), path: listing.path, items: listing.items }, "获取目录成功");
  });

  // 单文件下载（后端代理流式输出，成功后累计下载计数）
  router.get("/api/share/folder/:slug/download", async (c) => {
    const db = c.env.DB;
    const slug = c.req.param("slug");
    const encryptionSecret = getEncryptionSecret(c);
    const repositoryFactory = useRepositories(c);

    const record = await loadFolderShare(db, slug, encryptionSecret);
    await ensureAccessible(db, record, encryptionSecret, repositoryFactory);
    await ensurePassword(record, c.req.query("password"));

    const relPath = normalizeRelPath(c.req.query("path"));
    if (!relPath) {
      throw new ValidationError("缺少文件路径");
    }

    const fullSubPath = joinStoragePath(record.storage_path, relPath);

    // 校验目标必须是文件（目录拒绝下载）
    const pseudoMount = {
      id: record.id,
      storage_type: record.storage_type,
      storage_config_id: record.storage_config_id,
    };
    const mountManager = new MountManager(db, encryptionSecret, repositoryFactory);
    const driver = await mountManager.getDriver(pseudoMount);
    const info = await driver.getFileInfo(`/${fullSubPath}`, {
      path: `/${relPath}`,
      mount: pseudoMount,
      subPath: `/${fullSubPath}`,
      db,
    });
    if (info?.isDirectory) {
      throw new ValidationError("不能下载目录");
    }

    const streaming = new StorageStreaming({
      mountManager: null,
      storageFactory: StorageFactory,
      encryptionSecret,
    });

    const response = await streaming.createResponse({
      path: fullSubPath,
      channel: STREAMING_CHANNELS.SHARE,
      storageConfigId: record.storage_config_id,
      rangeHeader: c.req.header("Range") || null,
      request: c.req.raw,
      db,
      repositoryFactory,
    });

    const filename = relPath.split("/").filter(Boolean).pop() || record.filename || "download";
    // inline=1 时以内联方式返回（用于页面内预览）；默认强制下载
    const inlineParam = String(c.req.query("inline") || "").toLowerCase();
    const isInline = inlineParam === "1" || inlineParam === "true";
    const { contentType, contentDisposition } = getContentTypeAndDisposition(filename, null, {
      forceDownload: !isInline,
    });
    response.headers.set("Content-Type", contentType);
    response.headers.set("Content-Disposition", contentDisposition);

    // CORS 头（与分享代理链路保持一致）
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Range, Content-Type");
    response.headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

    // 成功交付后累计下载计数（文件夹分享的下载次数为内部所有文件的累计值）
    // 仅“实际下载”计数；inline=1 为页面内预览，不消耗次数
    if (!isInline && (response.status === 302 || (response.status >= 200 && response.status < 300))) {
      try {
        await repositoryFactory.getFileRepository().incrementDownloads(record.id);
      } catch (e) {
        console.warn("递增下载计数失败（已忽略）:", e?.message || e);
      }
    }

    return response;
  });
};
