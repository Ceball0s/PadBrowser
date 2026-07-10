<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'
import NavButtons from './NavButtons.vue'

const { t } = useI18n()
import TabBar from './TabBar.vue'
import UrlBar from './UrlBar.vue'
import WindowControls from './WindowControls.vue'

interface Tab {
  id: string
  title: string
  url: string
  active: boolean
}

const props = defineProps<{
  url: string
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
  tabs: Tab[]
  consoleMode: boolean
  overlayOpen: boolean
  downloadCount: number
  favorite: boolean
}>()

const emit = defineEmits<{
  navigate: [url: string]
  goBack: []
  goForward: []
  reload: []
  goHome: []
  newTab: []
  closeTab: [id: string]
  switchTab: [id: string]
  quit: []
  minimize: []
  maximize: []
  toggleDownloads: []
  toggleOptions: []
  toggleFavorite: []
}>()

const urlInputValue = ref(props.url)
const showUrlBar = ref(false)
const isMaximized = ref(false)

watch(() => props.url, (val) => {
  if (!showUrlBar.value) {
    urlInputValue.value = val
  }
})

function handleUrlBarNavigate(url: string): void {
  emit('navigate', url)
  showUrlBar.value = false
}

function switchAndEditUrl(tabId: string): void {
  if (props.overlayOpen) {
    emit('switchTab', tabId)
    return
  }

  const tab = props.tabs.find(t => t.id === tabId)
  const isCurrentTab = tab?.active

  if (!isCurrentTab) {
    emit('switchTab', tabId)
    return
  }

  nextTick(() => {
    urlInputValue.value = props.url
    showUrlBar.value = true
  })
}

function minimizeApp(): void {
  if (typeof window.nova?.minimize === 'function') window.nova.minimize()
}

function maximizeApp(): void {
  if (typeof window.nova?.maximize === 'function') window.nova.maximize()
}

function quitApp(): void {
  if (typeof window.nova?.quit === 'function') window.nova.quit()
}

onMounted(() => {
  if (typeof window.nova?.isMaximized === 'function') {
    window.nova.isMaximized().then((maximized: boolean) => {
      isMaximized.value = maximized
    })
  }
  if (typeof window.nova?.onMaximized === 'function') {
    window.nova.onMaximized(() => { isMaximized.value = true })
  }
  if (typeof window.nova?.onUnmaximized === 'function') {
    window.nova.onUnmaximized(() => { isMaximized.value = false })
  }
})

onUnmounted(() => {})

function editUrl(): void {
  urlInputValue.value = props.url
  showUrlBar.value = true
}

defineExpose({ editUrl })
</script>

<template>
  <div class="app-header">
    <div class="drag-handle" :title="t('toolbar.dragHandle')"></div>
    <header class="toolbar">
      <div class="toolbar-left">
        <button
          class="toolbar-btn"
          @click="emit('toggleOptions')"
          :title="t('toolbar.options')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>

        <NavButtons
          :can-go-back="canGoBack"
          :can-go-forward="canGoForward"
          :is-loading="isLoading"
          @go-back="emit('goBack')"
          @go-forward="emit('goForward')"
          @go-home="emit('goHome')"
          @reload="emit('reload')"
        />
      </div>

      <div class="toolbar-center">
        <UrlBar
          v-if="showUrlBar"
          :model-value="urlInputValue"
          @navigate="handleUrlBarNavigate"
          @close="showUrlBar = false"
        />
        <TabBar
          v-else
          :tabs="tabs"
          :overlay-open="overlayOpen"
          @switch-tab="switchAndEditUrl"
          @close-tab="(id: string) => emit('closeTab', id)"
        />
      </div>

      <div class="toolbar-drag-spacer" aria-hidden="true"></div>

      <div class="toolbar-right">
        <button
          class="toolbar-btn"
          @click="emit('newTab')"
          :title="t('toolbar.newTab')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          v-if="url && !url.startsWith('app-drift://') && url !== 'about:blank'"
          class="toolbar-btn star-btn"
          :class="{ favorited: favorite }"
          @click="emit('toggleFavorite')"
          :title="favorite ? t('toolbar.removeFavorite') : t('toolbar.addFavorite')"
        >
          <svg viewBox="0 0 24 24" :fill="favorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>

        <button
          class="toolbar-btn dl-btn"
          @click="emit('toggleDownloads')"
          :title="t('toolbar.downloads')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span v-if="downloadCount > 0" class="dl-badge">{{ downloadCount }}</span>
        </button>

        <WindowControls
          :is-maximized="isMaximized"
          :console-mode="props.consoleMode"
          @minimize="minimizeApp"
          @maximize="maximizeApp"
          @quit="quitApp"
        />
      </div>
    </header>

  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
}

.drag-handle {
  height: 0;
  background: transparent;
  -webkit-app-region: drag;
  cursor: move;
  border-top: 0;
}

.toolbar {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 0;
  background: linear-gradient(90deg, #1a1435 0%, #1d163a 50%, #1a1435 100%);
  border-bottom: 0;
  height: 42px;
  position: relative;
  user-select: none;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 1px;
}

.toolbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 4px;
  height: 100%;
}

.toolbar-drag-spacer {
  width: 12px;
  flex: 0 0 72px;
  -webkit-app-region: drag;
  /* background: linear-gradient(0deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08));
  border-left: 1px solid rgba(255,255,255,0.06); */
  border-right: 1px solid rgba(255,255,255,0.03);
}

.toolbar-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--text);
  cursor: pointer;
  transition: all 0.12s ease;
  flex-shrink: 0;
  padding: 0;
}

.toolbar-btn:hover {
  background: rgba(210, 200, 230, 0.14);
}

.toolbar-btn:active {
  background: rgba(210, 200, 230, 0.22);
}

/*
.toolbar-btn:focus-visible {
  outline: none;
  box-shadow: none;
  background: rgba(232, 220, 224, 0.24);
  color: #ffffff;
}
  */

.toolbar-btn:is(:focus, :focus-visible) {
  outline: none;
  background: rgba(232,220,224,.24);
  color: #fff;
}

.toolbar-btn svg {
  width: 20px;
  height: 20px;
}

.star-btn.favorited {
  color: var(--accent);
}

.dl-btn {
  position: relative;
}

.dl-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border-radius: 8px;
  color: var(--bg);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}

</style>
