<template>
  <div class="file-upload-container mx-auto px-3 sm:px-6 flex-1 flex flex-col pt-6 sm:pt-8 w-full max-w-full sm:max-w-6xl">
    <div class="header mb-4 border-b pb-2" :class="darkMode ? 'border-gray-700' : 'border-gray-200'">
      <h2 class="text-xl font-semibold">{{ t("file.uploadPageTitle") }}</h2>
    </div>

    <!-- 权限管理组件 -->
    <PermissionManager
      :dark-mode="darkMode"
      permission-type="file"
      :permission-required-text="$t('file.permissionRequired')"
      :login-auth-text="$t('file.loginOrAuth')"
      @permission-change="handlePermissionChange"
      @navigate-to-admin="navigateToAdmin"
    />

    <div class="main-content" v-if="hasPermission">
      <!-- 文件上传区域 -->
      <div class="card mb-6 p-4 sm:p-6">
        <UppyShareUploader
          :dark-mode="darkMode"
          :loading="loadingFiles"
          :is-admin="isAdmin"
          :storage-configs="storageConfigsStore.sortedConfigs"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
          @share-results="handleShareResults"
        />
      </div>

      <!-- 分享链接 -->
      <div v-if="shareResults.length" class="card mb-6 p-4 sm:p-6">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 class="text-lg font-medium" :class="darkMode ? 'text-gray-100' : 'text-gray-800'">{{ t("file.shareResultsTitle") }}</h3>
          <button
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border"
            :class="darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'"
            @click="clearShareResults"
          >
            {{ t("file.clearShareResults") }}
          </button>
        </div>

        <div :class="shareListContainerClass">
          <div
            v-for="item in shareResults"
            :key="item.id || item.slug || item.shareUrl"
            class="rounded-md border px-3 py-2.5 flex flex-col gap-1.5"
            :class="darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white'"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span class="text-sm font-medium truncate" :class="darkMode ? 'text-gray-100' : 'text-gray-800'">{{ item.filename }}</span>
              <span v-if="item.storageLabel" class="text-xs px-2 py-0.5 rounded-full" :class="darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'">
                {{ item.storageLabel }}
              </span>
            </div>

            <ShareLinkBox
              :dark-mode="darkMode"
              :label="t('file.sharePrimaryLinkLabel')"
              :share-link="item.shareUrl"
              :copy-tooltip="t('file.copyLink')"
              :copy-success-text="t('file.linkCopied')"
              :copy-failure-text="t('file.copyFailed')"
              :show-qr-button="true"
              :qr-tooltip="t('file.showQRCode')"
              :secondary-link="item.downloadUrl"
              :secondary-tooltip="t('file.copyDirectLink')"
              :secondary-success-text="t('file.directLinkCopied')"
              :secondary-failure-text="t('file.copyFailed')"
              :show-countdown="false"
              @show-qr-code="openShareQRCode"
              @status-message="handleShareBoxStatus"
            />
          </div>
        </div>
      </div>

      <!-- 最近上传记录 -->
      <div v-if="canLoadRecentFiles && recentFiles.length > 0" class="card p-4 sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">{{ t("file.recentUploads") }}</h3>
          <span class="text-sm" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">{{ t("file.showingRecent") }}</span>
        </div>
        <FileList :dark-mode="darkMode" :files="recentFiles" :loading="loadingFiles" :user-type="isAdmin ? 'admin' : 'apikey'" @refresh="loadFiles" />
      </div>
    </div>

    <QRCodeModal :visible="showShareQrModal" :share-link="currentShareLink" @close="closeShareQRCode" @status-message="handleShareBoxStatus" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { storeToRefs } from "pinia";
import UppyShareUploader from "@/modules/upload/public/components/UppyShareUploader.vue";
import FileList from "@/modules/upload/public/components/FileList.vue";
import PermissionManager from "@/components/common/PermissionManager.vue";
import ShareLinkBox from "@/components/common/ShareLinkBox.vue";
import QRCodeModal from "@/modules/paste/editor/components/QRCodeModal.vue";
import { useI18n } from "vue-i18n"; // 导入i18n
import { useAuthStore } from "@/stores/authStore.js";
import { useStorageConfigsStore } from "@/stores/storageConfigsStore.js";
import { useUploadService } from "@/modules/upload/services/uploadService.js";
import { useGlobalMessage } from "@/composables/core/useGlobalMessage.js";
import { useThemeMode } from "@/composables/core/useThemeMode.js";
import { createLogger } from "@/utils/logger.js";

const { t } = useI18n(); // 初始化i18n
const log = createLogger("UploadView");
const { getRecentFiles } = useUploadService();
const { showSuccess, showError, showWarning } = useGlobalMessage();

// 使用认证Store
const authStore = useAuthStore();
const { isAdmin, hasFileSharePermission, hasFileManagePermission } = storeToRefs(authStore);

const { isDarkMode: darkMode } = useThemeMode();

// 数据状态
const storageConfigsStore = useStorageConfigsStore();
const files = ref([]);
const loadingFiles = ref(false);
const shareResults = ref([]);
const shareResultsCacheKey = (item) => item?.id || item?.slug || item?.shareUrl || `${item?.filename || ""}-${item?.shareUrl || ""}`;
const shareListContainerClass = computed(() => {
  const base = "space-y-3";
  if (shareResults.value.length > 3) {
    return `${base} share-results-scroll`;
  }
  return base;
});
const showShareQrModal = ref(false);
const currentShareLink = ref("");

// 从Store获取权限状态的计算属性（文件上传 = FILE_SHARE）
const hasPermission = computed(() => hasFileSharePermission.value);
const canLoadRecentFiles = computed(() => hasFileManagePermission.value);

// 计算最近3条记录
const recentFiles = computed(() => {
  return files.value.slice(0, 3);
});

// 导航到管理页面
const navigateToAdmin = () => {
  import("@/router").then(({ routerUtils }) => {
    routerUtils.navigateTo("admin");
  });
};

// 权限变化处理 - 当权限状态改变时执行相应的业务逻辑
const handlePermissionChange = async (hasPermissionValue) => {
  if (hasPermissionValue) {
    const tasks = [loadStorageConfigs({ force: true })];
    if (canLoadRecentFiles.value) {
      tasks.push(loadFiles());
    } else {
      files.value = [];
    }
    await Promise.all(tasks);
  } else {
    files.value = [];
    shareResults.value = [];
  }
};

// 加载存储配置（默认抓取前100个即可覆盖常见场景）
const loadStorageConfigs = async (options = {}) => {
  if (!hasPermission.value) return;

  try {
    if (options.force) {
      await storageConfigsStore.refreshConfigs();
    } else {
      await storageConfigsStore.loadConfigs();
    }
  } catch (error) {
    log.error("加载存储配置失败:", error);
  }
};

// 加载已上传文件列表
const loadFiles = async () => {
  if (!hasPermission.value || !canLoadRecentFiles.value) {
    files.value = [];
    return;
  }

  loadingFiles.value = true;
  try {
    const list = await getRecentFiles(5);
    files.value = list;
  } catch (error) {
    log.error("加载文件列表失败:", error);
    showError(`${t("file.messages.getFileDetailFailed")}: ${error.message || t("file.messages.unknownError")}`);
  } finally {
    loadingFiles.value = false;
  }
};

// 处理上传成功事件
const handleUploadSuccess = (fileData) => {
  // 刷新文件列表
  if (canLoadRecentFiles.value) {
    loadFiles();
  }

  // Share 上传页的“预签名秒传/去重”：部分文件可能会被标记为 skipUpload=true（对象已存在，跳过 PUT）
  const files = Array.isArray(fileData)
    ? fileData
    : Array.isArray(fileData?.uploadResults)
      ? fileData.uploadResults
      : [];

  const successCount = files.length;
  const skippedUploadCount = files.filter((item) => item?.meta?.skipUpload === true).length;

  // 文案：单文件/多文件分别用已有 key，跳过上传则追加提示
  let message = successCount > 1 ? t("file.multipleUploadsSuccessful", { count: successCount }) : t("file.uploadSuccessful");
  if (skippedUploadCount > 0) {
    message += `（${t("file.skippedExistingUploads", { count: skippedUploadCount })}）`;
  }

  showSuccess(message);
};

const handleShareResults = (results = []) => {
  if (!Array.isArray(results) || !results.length) return;
  const map = new Map();
  shareResults.value.forEach((item) => {
    const key = shareResultsCacheKey(item);
    if (key) {
      map.set(key, item);
    }
  });
  results.forEach((item) => {
    if (!item || !item.shareUrl) return;
    const key = shareResultsCacheKey(item);
    if (key) {
      map.set(key, item);
    }
  });
  shareResults.value = Array.from(map.values());
};

const clearShareResults = () => {
  shareResults.value = [];
};

const openShareQRCode = (link) => {
  if (!link) return;
  currentShareLink.value = link;
  showShareQrModal.value = true;
};

const closeShareQRCode = () => {
  showShareQrModal.value = false;
  currentShareLink.value = "";
};

const handleShareBoxStatus = (payload) => {
  if (!payload || !payload.message) return;
  if (payload.type === "success") {
    showSuccess(payload.message);
  } else if (payload.type === "warning") {
    showWarning(payload.message);
  } else {
    showError(payload.message);
  }
};

// 处理上传错误事件
const handleUploadError = (error) => {
  if (
    error &&
    error.message &&
    (error.message.includes("存储空间不足") ||
      error.message.includes("insufficient storage") ||
      error.message.includes("容量") ||
      error.message.includes("storage limit"))
  ) {
    showWarning(error.message);
  } else {
    showError(error.message || t("file.messages.unknownError"));
  }
};

// 初始化与后续权限变化均通过 PermissionManager 的 permission-change 事件驱动
</script>

<style scoped>
/* 响应式设计 */
@media (max-width: 640px) {
  .file-upload-container {
    padding-top: 1rem;
  }
}

.share-results-scroll {
  max-height: 26rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

@media (max-width: 640px) {
  .share-results-scroll {
    max-height: none;
    overflow-y: visible;
    padding-right: 0;
  }
}

</style>
