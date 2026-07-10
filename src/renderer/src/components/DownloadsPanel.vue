<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const emit = defineEmits<{
  close: []
}>()

interface DownloadItem {
  id: string
  name: string
  path: string
  received: number
  total: number
  done: boolean
}

const downloads = ref<DownloadItem[]>([])

function openDownload(path: string): void {
  if (typeof window.nova?.openDownload === 'function') {
    window.nova.openDownload(path)
  }
}

function clearDownloads(): void {
  if (typeof window.nova?.clearDownloads === 'function') {
    window.nova.clearDownloads()
  }
  downloads.value = []
}

let unsubProgress: (() => void) | null = null
let unsubDone: (() => void) | null = null

onMounted(async () => {
  if (typeof window.nova?.getDownloads === 'function') {
    const list = await window.nova.getDownloads()
    downloads.value = list as DownloadItem[]
  }

  if (typeof window.nova?.onDownloadProgress === 'function') {
    window.nova.onDownloadProgress((data: { id: string; received: number; total: number }) => {
      const item = downloads.value.find(d => d.id === data.id)
      if (item) {
        item.received = data.received
        item.total = data.total
      } else {
        window.nova.getDownloads().then(list => { downloads.value = list as DownloadItem[] })
      }
    })
  }

  if (typeof window.nova?.onDownloadDone === 'function') {
    window.nova.onDownloadDone((data: { id: string; path: string; success: boolean }) => {
      const item = downloads.value.find(d => d.id === data.id)
      if (item) {
        item.done = data.success
        item.path = data.path
      } else {
        window.nova.getDownloads().then(list => { downloads.value = list as DownloadItem[] })
      }
    })
  }
})

onUnmounted(() => {
  if (unsubProgress) unsubProgress()
  if (unsubDone) unsubDone()
})
</script>

<template>
  <div class="downloads-panel">
    <div class="downloads-header">
      <h2>{{ t('downloads.title') }}</h2>
      <div class="header-actions">
        <button
          v-if="downloads.length > 0"
          class="clear-btn"
          @click="clearDownloads"
        >
          {{ t('downloads.clear') }}
        </button>
        <button class="close-btn" @click="emit('close')" :title="t('downloads.close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
    <div v-if="downloads.length === 0" class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <p>{{ t('downloads.empty') }}</p>
    </div>
    <div v-else class="downloads-list">
      <div
        v-for="item in downloads"
        :key="item.id"
        class="download-item"
      >
        <div class="download-info">
          <span class="download-name">{{ item.name }}</span>
          <div class="progress-wrap">
            <div
              class="progress-bar"
              :class="{ done: item.done }"
              :style="{ width: item.total > 0 ? Math.min(100, (item.received / item.total) * 100) + '%' : '0%' }"
            ></div>
          </div>
          <span class="download-status">
            <template v-if="item.done">
              {{ t('downloads.completed') }}
            </template>
            <template v-else-if="item.total > 0">
              {{ Math.round(item.received / 1024) }} / {{ Math.round(item.total / 1024) }} KB
            </template>
            <template v-else>
              {{ t('downloads.downloading') }}
            </template>
          </span>
        </div>
        <button
          v-if="item.done && item.path"
          class="open-btn"
          @click="openDownload(item.path)"
          :title="t('downloads.openFile')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.downloads-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  padding: 24px;
  overflow-y: auto;
}

.downloads-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.downloads-header h2 {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid var(--accent-dim);
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  font-size: var(--font-base);
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: rgba(255, 34, 85, 0.08);
  color: var(--text);
}

.close-btn {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: rgba(210, 200, 230, 0.14);
  color: var(--text);
}

.close-btn svg {
  width: 28px;
  height: 28px;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  gap: 12px;
}

.empty-icon {
  width: 32px;
  height: 32px;
  opacity: 0.5;
}

.empty p {
  font-size: var(--font-base);
}

.downloads-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.download-item:hover {
  background: var(--surface-hover);
}

.download-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.download-name {
  font-size: var(--font-base);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-wrap {
  height: 6px;
  background: var(--surface-active);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-bar.done {
  background: var(--cyan);
}

.download-status {
  font-size: 14px;
  color: var(--text-dim);
}

.open-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-dim);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.open-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  color: var(--cyan);
}

.open-btn svg {
  width: 20px;
  height: 20px;
}
</style>
