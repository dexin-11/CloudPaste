<template>
  <div class="url-uploader">
    <!-- URL输入区域 -->
    <div
      class="url-input-zone mb-5 border-2 border-dashed rounded-lg transition-all duration-300 overflow-hidden"
      :class="darkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50'"
    >
      <!-- 上部图标和说明 -->
      <div class="flex flex-col items-center justify-center py-4 px-4">
        <div class="icon-container mb-2 bg-opacity-10 p-2 rounded-full" :class="darkMode ? 'bg-blue-600' : 'bg-blue-100'">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 transition-colors duration-300"
            :class="darkMode ? 'text-blue-400' : 'text-blue-600'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
          </svg>
        </div>
        <div class="text-center mb-3">
          <p class="text-base font-medium transition-colors duration-300" :class="darkMode ? 'text-gray-200' : 'text-gray-800'">
            {{ t("file.enterUrl") }}
          </p>
          <p class="text-xs mt-0.5 transition-colors duration-300" :class="darkMode ? 'text-gray-400' : 'text-gray-500'">
            {{ t("file.supportedUrlTypes") }}
          </p>
        </div>
      </div>

      <!-- 输入框区域 - 使用渐变边框效果 -->
      <div class="px-4 pb-6">
        <div class="w-full max-w-md mx-auto relative">
          <div
            class="input-wrapper relative rounded-lg overflow-hidden shadow-sm"
            :class="[darkMode ? 'shadow-gray-800' : 'shadow-gray-200', urlInput ? (darkMode ? 'ring-1 ring-blue-600/50' : 'ring-1 ring-blue-500/50') : '']"
          >
            <input
              type="url"
              v-model="urlInput"
              class="form-input w-full pr-[110px] rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent h-12 px-4"
              :class="[
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
              ]"
              :placeholder="t('file.urlPlaceholder')"
              :disabled="isAnalyzing || isUploading"
            />
            <button
              type="button"
              @click="analyzeUrl"
              class="absolute right-0 top-0 h-full px-4 font-medium focus:outline-none transition-colors flex items-center justify-center min-w-[100px] rounded-r-md"
              :class="[
                isAnalyzing
                  ? darkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white',
                !urlInput ? (darkMode ? 'opacity-60' : 'opacity-60') : '',
              ]"
              :disabled="!urlInput || isAnalyzing || isUploading"
            >
              <svg v-if="isAnalyzing" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isAnalyzing ? t("file.analyzing") : t("file.analyze") }}
            </button>
          </div>
          <p v-if="urlError" class="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ urlError }}
          </p>
        </div>
      </div>
    </div>

    <!-- 已解析文件信息预览 -->
    <div v-if="fileInfo" class="url-file-preview mb-5 animate-fadeIn">
      <div class="files-header flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium flex items-center" :class="darkMode ? 'text-gray-200' : 'text-gray-700'">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-1.5"
            :class="darkMode ? 'text-blue-400' : 'text-blue-600'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {{ t("file.urlFileInfo") }}
        </h3>
        <button
          type="button"
          @click="clearFileInfo"
          class="text-xs px-2 py-1 rounded transition-colors flex items-center"
          :class="darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'"
          :disabled="isUploading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {{ t("file.clear") }}
        </button>
      </div>

      <div class="file-item p-3 rounded-lg border transition-colors" :class="darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'">
        <div class="flex items-center">
          <div class="file-icon mr-3 p-1.5 rounded-lg" :class="darkMode ? 'bg-gray-700' : 'bg-white'">
            <div class="h-8 w-8" v-html="getFileIconClassLocal(fileInfo.filename)"></div>
          </div>
          <div class="file-info w-0 flex-grow mr-3">
            <div class="font-medium text-base truncate" :class="darkMode ? 'text-white' : 'text-gray-900'">
              {{ displayFilename }}
            </div>
            <div class="flex justify-between mt-0.5">
              <span class="text-xs font-medium px-1.5 py-0.5 rounded-full" :class="darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'">
                {{ displayFileSize }}
              </span>
              <span
                v-if="displayMimeType"
                class="text-xs px-1.5 py-0.5 rounded-full max-w-32 truncate inline-block"
                :class="darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'"
                :title="displayMimeType"
              >
                {{ displayMimeType }}
              </span>
            </div>
          </div>
        </div>

        <!-- 自定义文件名 -->
        <div class="mt-3 pt-2 border-t" :class="darkMode ? 'border-gray-700' : 'border-gray-200'">
          <label class="text-xs font-medium mb-1 block" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">
            {{ t("file.customFileName") }}
          </label>
          <input
            type="text"
            v-model="customFilename"
            class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent py-2"
            :class="[
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
            ]"
            :placeholder="displayFilename || t('file.customFilename')"
            :disabled="isUploading"
          />
        </div>
      </div>
    </div>

    <!-- 上传选项表单 -->
    <div class="upload-form">
      <form @submit.prevent="submitUpload">
        <!-- 存储配置选择 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-4" :class="darkMode ? 'text-gray-200' : 'text-gray-700'">{{ t("file.storage") }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.storage") }}</label>
              <div class="relative">
                <select
                  v-model="formData.storage_config_id"
                  class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent appearance-none"
                  :class="[
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                  ]"
                  :disabled="!storageConfigs.length || loading || isUploading"
                  required
                >
                  <option value="" disabled selected>{{ storageConfigs.length ? t("file.selectStorage") : t("file.noStorage") }}</option>
                  <option v-for="config in storageConfigs" :key="config.id" :value="config.id">{{ formatStorageOptionLabel(config) }}</option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    :class="darkMode ? 'text-gray-400' : 'text-gray-500'"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <!-- 存储路径 -->
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.path") }}</label>
              <input
                type="text"
                v-model="formData.path"
                class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                ]"
                :placeholder="t('file.pathPlaceholder')"
                :disabled="isUploading"
              />
            </div>
          </div>
        </div>

        <!-- 分享设置表单 -->
        <div class="mt-6 border-t pt-4 w-full overflow-hidden" :class="darkMode ? 'border-gray-700' : 'border-gray-200'">
          <h3 class="text-lg font-medium mb-4" :class="darkMode ? 'text-gray-200' : 'text-gray-700'">{{ t("file.shareSettings") }}</h3>
          <!-- 使用与FileUploader相同的表单布局 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- 备注 -->
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.remark") }}</label>
              <input
                type="text"
                v-model="formData.remark"
                class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                ]"
                :placeholder="t('file.remarkPlaceholder')"
                :disabled="isUploading"
              />
            </div>

            <!-- 自定义链接 -->
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.customLink") }}</label>
              <input
                type="text"
                v-model="formData.slug"
                class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                  slugError ? (darkMode ? 'border-red-500' : 'border-red-600') : '',
                ]"
                :placeholder="t('file.customLinkPlaceholder')"
                :disabled="isUploading"
                @input="validateCustomLink"
              />
              <p v-if="slugError" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ slugError }}</p>
              <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t("file.onlyAllowedChars") }}</p>
            </div>

            <!-- 密码保护 -->
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.passwordProtection") }}</label>
              <input
                type="text"
                v-model="formData.password"
                class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                ]"
                :placeholder="t('file.passwordPlaceholder')"
                :disabled="isUploading"
              />
            </div>

            <!-- 过期时间 -->
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.expireTime") }}</label>
              <select
                v-model="formData.expires_in"
                class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                ]"
                :disabled="isUploading"
              >
                <option value="1">{{ t("file.expireOptions.hour1") }}</option>
                <option value="24">{{ t("file.expireOptions.day1") }}</option>
                <option value="168">{{ t("file.expireOptions.day7") }}</option>
                <option value="720">{{ t("file.expireOptions.day30") }}</option>
                <option value="0">{{ t("file.expireOptions.never") }}</option>
              </select>
            </div>

            <!-- 最大查看次数 -->
            <div class="form-group flex flex-col">
              <label class="form-label text-sm font-medium mb-1.5" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.maxViews") }}</label>
              <input
                type="number"
                v-model.number="formData.max_views"
                min="0"
                step="1"
                pattern="\d*"
                class="form-input w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:border-transparent"
                :class="[
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:ring-offset-white',
                ]"
                :placeholder="t('file.maxViewsPlaceholder')"
                :disabled="isUploading"
                @input="validateMaxViews"
              />
            </div>
          </div>

          <!-- 上传进度 -->
          <div v-if="uploadProgress > 0 && isUploading" class="mt-4">
            <div class="flex justify-between items-center mb-1">
              <div class="flex items-center">
                <span class="text-sm mr-2" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.uploadProgress") }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded mr-2"
                  :class="[
                    currentStage === 'cancelled'
                      ? darkMode
                        ? 'bg-red-900/30 text-red-200'
                        : 'bg-red-100 text-red-700'
                      : darkMode
                      ? 'bg-blue-900/30 text-blue-200'
                      : 'bg-blue-100 text-blue-700',
                  ]"
                >
                  <template v-if="currentStage === 'starting'">
                    {{ t("file.starting") }}
                  </template>
                  <template v-else-if="currentStage === 'downloading'">
                    {{ t("file.downloading") }}
                  </template>
                  <template v-else-if="currentStage === 'downloading_proxy'">
                    {{ t("file.downloadingProxy") }}
                  </template>
                  <template v-else-if="currentStage === 'preparing'">
                    {{ t("file.preparing") }}
                  </template>
                  <template v-else-if="currentStage === 'initializing'">
                    {{ t("file.initializing") }}
                  </template>
                  <template v-else-if="currentStage === 'uploading'">
                    {{ t("file.uploading") }}
                  </template>
                  <template v-else-if="currentStage === 'finalizing'">
                    {{ t("file.finalizing") }}
                  </template>
                  <template v-else-if="currentStage === 'completed'">
                    {{ t("file.completed") }}
                  </template>
                  <template v-else-if="currentStage === 'cancelled'">
                    {{ t("file.cancelled") }}
                  </template>
                </span>
                <span v-if="uploadSpeed" class="text-xs px-2 py-0.5 rounded" :class="darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'">
                  {{ uploadSpeed }}
                </span>
              </div>
              <span class="text-sm font-medium" :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
              <div
                class="h-2.5 rounded-full transition-all duration-200 ease-out relative overflow-hidden"
                :class="[currentStage === 'cancelled' ? 'bg-red-600' : uploadProgress >= 95 ? 'bg-green-600' : 'bg-blue-600']"
                :style="{ width: `${uploadProgress}%` }"
              >
                <div class="progress-stripes absolute inset-0 w-full h-full" :class="uploadProgress < 100 ? 'animate-progress-stripes' : ''"></div>
              </div>
            </div>
          </div>

          <!-- 上传方式选择（与 FileUploader 保持一致） -->
          <div class="mt-2 mb-4 flex items-center gap-6">
            <label class="flex items-center cursor-pointer" :class="!canUsePresigned || isUploading ? 'opacity-50 cursor-not-allowed' : ''">
              <input
                type="radio"
                v-model="uploadMode"
                value="presign"
                :disabled="!canUsePresigned || isUploading"
                class="w-4 h-4 mr-2"
              />
              <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.uploadModes.presign") }}</span>
              <span
                v-if="!canUsePresigned"
                class="ml-1 text-xs"
                :class="darkMode ? 'text-gray-500' : 'text-gray-400'"
              >{{ t("file.uploadModes.presignOnly") }}</span>
            </label>
            <label class="flex items-center cursor-pointer" :class="isUploading ? 'opacity-50 cursor-not-allowed' : ''">
              <input
                type="radio"
                v-model="uploadMode"
                value="direct"
                :disabled="isUploading"
                class="w-4 h-4 mr-2"
              />
              <span :class="darkMode ? 'text-gray-300' : 'text-gray-700'">{{ t("file.uploadModes.direct") }}</span>
            </label>
          </div>

          <!-- 表单按钮 -->
          <div class="submit-section mt-6 flex flex-row items-center gap-3">
            <button
              type="submit"
              :disabled="!fileInfo || !formData.storage_config_id || isUploading || loading"
              class="btn-primary px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center min-w-[120px]"
              :class="[
                !fileInfo || !formData.storage_config_id || isUploading || loading
                  ? darkMode
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600 focus:ring-offset-gray-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 focus:ring-offset-white',
              ]"
            >
              <svg v-if="isUploading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isUploading ? t("file.loading") : t("file.upload") }}
            </button>

            <!-- 将取消按钮放在上传按钮右侧 -->
            <button
              v-if="isUploading"
              type="button"
              @click="cancelUpload"
              class="px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center justify-center border"
              :class="
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-red-900/60 hover:text-red-200 hover:border-red-800 focus:ring-gray-500 focus:ring-offset-gray-800'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 focus:ring-gray-300 focus:ring-offset-white'
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {{ t("file.cancel") }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "@/api";
import { getFileIcon } from "@/utils/fileTypeIcons";
import { formatFileSize as formatFileSizeUtil } from "@/utils/fileTypes.js";
import { useShareSettingsForm } from "@/composables/upload/useShareSettingsForm.js";
import { useStorageConfigsStore } from "@/stores/storageConfigsStore.js";
import { useShareUploadController } from "@/modules/upload";
import { useFileshareService } from "@/modules/fileshare";

const props = defineProps({
  darkMode: { type: Boolean, default: false },
  storageConfigs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
});

const emit = defineEmits(["upload-success", "upload-error", "refresh-files", "share-results"]);
const { t } = useI18n();
const storageConfigsStore = useStorageConfigsStore();
const { activeUrlSession, createUrlSession, createUrlDirectSession, disposeUrlSession } = useShareUploadController();
const {
  formData,
  slugError,
  validateSlug,
  handleSlugInput,
  handleMaxViewsInput,
  selectDefaultStorageConfig,
  resetShareSettings,
} = useShareSettingsForm();
const fileshareService = useFileshareService();

const shareRecordMap = new Map();
const pendingShareItem = ref(null);
// URL 上传模式：'direct' 或 'presign'，默认与文件上传保持一致为预签名模式
const uploadMode = ref("presign");

// 实际可选的存储配置列表（优先使用父组件传入，其次使用全局 store）
const storageConfigs = computed(() => {
  if (props.storageConfigs && props.storageConfigs.length) {
    return props.storageConfigs;
  }
  return storageConfigsStore.sortedConfigs;
});

const currentStorageConfig = computed(() => {
  const id = formData.storage_config_id;
  if (!id) return null;
  return storageConfigs.value.find((cfg) => cfg.id === id) || null;
});

const canUsePresigned = computed(() => {
  const cfg = currentStorageConfig.value;
  if (!cfg) return false;
  const storageType = (cfg.storage_type || cfg.provider_type || "").toUpperCase();
  return storageType === "S3";
});

watch(
  canUsePresigned,
  (can) => {
    if (!can && uploadMode.value === "presign") {
      uploadMode.value = "direct";
    }
  },
  { immediate: true }
);

const emitShareResults = (results = []) => {
  emit("share-results", Array.isArray(results) ? results : []);
};

const getCurrentOrigin = () => (typeof window !== "undefined" && window.location ? window.location.origin : "");

const buildShareResultEntry = (record, meta = {}) => {
  if (!record) return null;
  const slug = record.slug || meta.slug || null;
  const origin = getCurrentOrigin();
  let shareUrl = "";
  if (slug) {
    shareUrl = fileshareService.buildShareUrl({ slug }, origin);
  } else if (record.url) {
    shareUrl = record.url.startsWith("http") || !origin ? record.url : `${origin.replace(/\/$/, "")}${record.url}`;
  }
  if (!shareUrl) return null;

  const previewUrl = record.previewUrl || record.proxyPreviewUrl || shareUrl;
  const downloadUrl = record.proxyDownloadUrl || record.downloadUrl || (slug ? fileshareService.getPermanentDownloadUrl({ slug }) : "");

  return {
    id: record.id || meta.fileId || slug || record.storage_path || record.filename,
    filename: record.filename || meta.filename || slug || "file",
    slug,
    shareUrl,
    previewUrl,
    downloadUrl,
    password: meta.password || null,
    expiresAt: record.expires_at || record.expiresAt || null,
  };
};

const flushPendingShareResult = () => {
  const pending = pendingShareItem.value;
  if (!pending) return;
  const record = pending.id ? shareRecordMap.get(pending.id) : null;
  if (!record) return;
  const entry = buildShareResultEntry(record, pending.meta);
  if (!entry) return;
  emitShareResults([entry]);
  if (pending.id) {
    shareRecordMap.delete(pending.id);
  }
  pendingShareItem.value = null;
  resetShareState();
};

const resetShareState = () => {
  shareRecordMap.clear();
  pendingShareItem.value = null;
};

watch(
  storageConfigs,
  (configs) => {
    if (!configs || configs.length === 0) {
      return;
    }
    if (formData.storage_config_id && configs.some((config) => config.id === formData.storage_config_id)) {
      return;
    }
    const defaultConfig = configs.find((config) => config.is_default);
    formData.storage_config_id = (defaultConfig || configs[0]).id;
  },
  { immediate: true }
);

const urlInput = ref("");
const urlError = ref("");
const isAnalyzing = ref(false);
const fileInfo = ref(null);
const customFilename = ref("");

const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadSpeed = ref("");
const currentStage = ref("starting");
const activeXhr = ref(null);
const isCancelled = ref(false);
const lastLoaded = ref(0);
const lastTime = ref(0);

const displayFileSize = computed(() => {
  const info = fileInfo.value;
  if (info && typeof info.size === "number" && info.size > 0) {
    return formatFileSizeUtil(info.size);
  }
  return t("file.unknownSize");
});

const displayMimeType = computed(() => {
  const info = fileInfo.value;
  if (!info) return null;
  if (info.contentType && info.contentType !== "application/octet-stream") {
    return info.contentType;
  }
  if (info.typeName && info.typeName !== "unknown") {
    return info.typeName;
  }
  return null;
});

const displayFilename = computed(() => {
  const info = fileInfo.value;
  if (!info || !info.filename) {
    return "unknown";
  }
  try {
    return decodeURIComponent(info.filename);
  } catch (error) {
    return info.filename;
  }
});

const getFileIconClassLocal = (filename) => {
  const mock = {
    extension: filename?.split(".").pop() || "",
    mime: fileInfo.value?.contentType || "",
    darkMode: props.darkMode,
  };
  return getFileIcon(mock, props.darkMode);
};

const formatStorageOptionLabel = (config) => {
  if (!config) {
    return t("file.storage");
  }
  const meta = config.provider_type || config.storage_type;
  return meta ? `${config.name} (${meta})` : config.name;
};

const isValidUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
};

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`;
  }
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

const analyzeUrl = async () => {
  urlError.value = "";
  fileInfo.value = null;
  if (!urlInput.value) return;
  if (!isValidUrl(urlInput.value)) {
    urlError.value = t("file.messages.invalidUrl");
    return;
  }

  isAnalyzing.value = true;
  try {
    const response = await api.urlUpload.validateUrlInfo(urlInput.value);
    if (!response?.success) {
      throw new Error(response?.message || t("file.messages.urlAnalysisFailed"));
    }
    fileInfo.value = response.data || null;
    customFilename.value = response.data?.filename || "";
    currentStage.value = "analysis";
  } catch (error) {
    urlError.value = error.message || t("file.messages.urlAnalysisFailed");
    fileInfo.value = null;
  } finally {
    isAnalyzing.value = false;
  }
};

const clearFileInfo = () => {
  fileInfo.value = null;
  customFilename.value = "";
  uploadProgress.value = 0;
  uploadSpeed.value = "";
  currentStage.value = "starting";
  urlError.value = "";
  resetShareSettings({ keepStorage: true });
};

const validateMaxViews = (event) => {
  handleMaxViewsInput(event?.target?.value ?? 0);
};

const validateCustomLink = (event) => {
  handleSlugInput(event?.target?.value ?? formData.slug);
  return validateSlug();
};

const ensurePreconditions = () => {
  if (!fileInfo.value) {
    emit("upload-error", new Error(t("file.messages.noFilesSelected")));
    return false;
  }
  if (!formData.storage_config_id) {
    selectDefaultStorageConfig();
    if (!formData.storage_config_id) {
      emit("upload-error", new Error(t("file.messages.noStorageConfig")));
      return false;
    }
  }
  if (Number(formData.max_views) < 0) {
    emit("upload-error", new Error(t("file.messages.negativeMaxViews")));
    return false;
  }
  if (formData.slug && !validateSlug()) {
    emit("upload-error", new Error(slugError.value));
    return false;
  }
  return true;
};

const buildPayload = () => {
  if (!formData.remark) {
    const maxLength = 100;
    const shortUrl = urlInput.value.length > maxLength ? `${urlInput.value.slice(0, maxLength)}...` : urlInput.value;
    formData.remark = `[${t("file.urlUpload.urlUpload")}]${shortUrl}`;
  }
  return {
    storage_config_id: formData.storage_config_id,
    slug: formData.slug || "",
    path: formData.path || "",
    remark: formData.remark || "",
    password: formData.password || "",
    expires_in: formData.expires_in || "0",
    max_views: Math.max(0, Number(formData.max_views) || 0),
  };
};

const updateSpeedMeter = (loaded) => {
  const now = Date.now();
  const elapsed = (now - lastTime.value) / 1000;
  if (elapsed > 0.5) {
    const delta = loaded - lastLoaded.value;
    uploadSpeed.value = formatSpeed(delta / elapsed);
    lastLoaded.value = loaded;
    lastTime.value = now;
  }
};

const handleProgress = ({ percent = 0, loaded = 0, total = fileInfo.value?.size || 1, stage }) => {
  uploadProgress.value = Math.min(100, Math.round(percent));
  if (stage === "downloading") {
    currentStage.value = "downloading";
  } else if (stage === "uploading") {
    currentStage.value = "uploading";
  }
  updateSpeedMeter(loaded);
};

const handleStageChange = (stage) => {
  if (stage === "presign") {
    currentStage.value = "initializing";
  } else if (stage === "transfer") {
    currentStage.value = "uploading";
  } else if (stage === "commit") {
    currentStage.value = "finalizing";
  }
};

const submitUpload = async () => {
  if (!ensurePreconditions() || isUploading.value) return;

  resetShareState();
  isUploading.value = true;
  isCancelled.value = false;
  uploadProgress.value = 0;
  uploadSpeed.value = "";
  currentStage.value = "starting";
  lastLoaded.value = 0;
  lastTime.value = Date.now();

  const payload = buildPayload();
  const meta = fileInfo.value || {};
  const filename = customFilename.value || meta.filename || "url-upload.bin";

  try {
    // 下载阶段（0-49%）
    handleStageChange("presign");
    handleStageChange("transfer");
    const blob = await api.urlUpload.fetchUrlContent({
      url: urlInput.value,
      onProgress: (progress, loaded, total) => {
        handleProgress({ percent: progress, loaded, total, stage: "downloading" });
      },
      setXhr: (xhr) => {
        activeXhr.value = xhr;
      },
    });
    // 上传阶段（50-100%）
    handleStageChange("upload");
    disposeUrlSession();
    const usePresigned = uploadMode.value === "presign" && canUsePresigned.value;
    const session = usePresigned
      ? createUrlSession({
          payload,
          events: {
            onProgress: ({ percent, bytesUploaded, bytesTotal }) => {
              const translatedPercent = 50 + Math.round((Math.min(100, percent) / 100) * 49);
              handleProgress({
                percent: translatedPercent,
                loaded: bytesUploaded,
                total: bytesTotal || blob.size || 1,
                stage: "uploading",
              });
            },
            onError: ({ error }) => {
              if (isCancelled.value) return;
              emit("upload-error", error);
            },
            onComplete: () => {
              currentStage.value = "completed";
              uploadProgress.value = 100;
              uploadSpeed.value = "";
              flushPendingShareResult();
              emit("upload-success", {
                message: t("file.urlUploadSuccess"),
                url: urlInput.value,
                fileInfo: fileInfo.value,
              });
              emit("refresh-files");
              resetForm({ preserveShareState: true });
            },
            onShareRecord: ({ file, shareRecord }) => {
              if (file?.id && shareRecord) {
                shareRecordMap.set(file.id, shareRecord);
              }
              flushPendingShareResult();
            },
          },
        })
      : createUrlDirectSession({
          payload,
          events: {
            onProgress: ({ percent, bytesUploaded, bytesTotal }) => {
              const translatedPercent = 50 + Math.round((Math.min(100, percent) / 100) * 49);
              handleProgress({
                percent: translatedPercent,
                loaded: bytesUploaded,
                total: bytesTotal || blob.size || 1,
                stage: "uploading",
              });
            },
            onError: ({ error }) => {
              if (isCancelled.value) return;
              emit("upload-error", error);
            },
            onComplete: () => {
              currentStage.value = "completed";
              uploadProgress.value = 100;
              uploadSpeed.value = "";
              flushPendingShareResult();
              emit("upload-success", {
                message: t("file.urlUploadSuccess"),
                url: urlInput.value,
                fileInfo: fileInfo.value,
              });
              emit("refresh-files");
              resetForm({ preserveShareState: true });
            },
            onShareRecord: ({ file, shareRecord }) => {
              if (file?.id && shareRecord) {
                shareRecordMap.set(file.id, shareRecord);
              }
              flushPendingShareResult();
            },
          },
        });
    const ids = session.addFiles([
      {
        data: blob,
        name: filename,
        type: meta.contentType || blob.type || "application/octet-stream",
      },
    ], () => ({ filename, sourceUrl: urlInput.value }));
    const fileId = Array.isArray(ids) ? ids[0] : ids;
    if (fileId) {
      pendingShareItem.value = {
        id: fileId,
        meta: {
          filename,
          slug: formData.slug || "",
          password: formData.password || "",
        },
      };
    }
    activeUrlSession.value = session;
    await session.start();
  } catch (error) {
    if (isCancelled.value) {
      currentStage.value = "cancelled";
    } else {
      emit("upload-error", error);
    }
  } finally {
    isUploading.value = false;
    activeXhr.value = null;
    isCancelled.value = false;
    disposeUrlSession();
  }
};

const cancelUpload = () => {
  if (!isUploading.value) return;
  isCancelled.value = true;
  currentStage.value = "cancelled";
  uploadProgress.value = 0;
  uploadSpeed.value = "";
  activeXhr.value?.abort?.();
  try { activeUrlSession.value?.cancel?.(); } catch {}
  disposeUrlSession();
  resetShareState();
  emit("upload-error", new Error(t("file.messages.uploadCancelled")));
};

const resetForm = (options = {}) => {
  urlInput.value = "";
  urlError.value = "";
  fileInfo.value = null;
  customFilename.value = "";
  uploadProgress.value = 0;
  uploadSpeed.value = "";
  currentStage.value = "starting";
  activeXhr.value?.abort?.();
  activeXhr.value = null;
  isCancelled.value = false;
  resetShareSettings({ keepStorage: true });
  disposeUrlSession();
  if (!options.preserveShareState) {
    resetShareState();
  }
};

onMounted(() => {
  selectDefaultStorageConfig();
});

onBeforeUnmount(() => {
  disposeUrlSession();
});
</script>


<style scoped>
.upload-form {
  width: 100%;
}

.progress-stripes {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

.animate-progress-stripes {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from {
    background-position: 1rem 0;
  }
  to {
    background-position: 0 0;
  }
}

.form-input:disabled,
.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.input-wrapper {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.input-wrapper:hover {
  transform: translateY(-1px);
}

.input-wrapper:focus-within {
  transform: translateY(-1px);
}

.url-file-preview {
  position: relative;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

/* 在暗模式下增强视觉对比度 */
.dark .url-input-zone {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark .file-item {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}
</style>

