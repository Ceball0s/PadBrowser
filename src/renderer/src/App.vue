<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n, initLocale } from './composables/useI18n'
import Toolbar from './components/Toolbar.vue'

const { t, setLocale, currentLocale } = useI18n()
import Keyboard from './components/Keyboard.vue'
import ConfirmQuitDialog from './components/ConfirmQuitDialog.vue'
import { useShortcuts } from './composables/useShortcuts'
import { useHistory } from './composables/useHistory'
import { useTabsManager, type Tab } from './composables/useTabsManager'
import { useWebviewManager } from './composables/useWebviewManager'
import { useAutoKeyboard } from './composables/useAutoKeyboard'
import { useUIState } from './composables/useUIState'
import { useGamepadActions } from './composables/useGamepadActions'
import { DRIFT_SETTINGS_URI, DRIFT_DOWNLOADS_URI, DRIFT_TUTORIAL_URI } from './utils/homepageHtml'
import LoadingOverlay from './components/LoadingOverlay.vue'
import iconPng from './assets/icon.png'

const tabs = ref<Tab[]>([{
  id: 'tab-1',
  title: t('app.home'),
  url: '',
  active: true,
  canGoBack: false,
  canGoForward: false,
  isLoading: false
}])

const {
  showKeyboard,
  consoleMode, autoKeyboard, downloadCount, backgroundImage, overlayOpen,
  toggleKeyboard, toggleAutoKeyboard,
  handleKeyboardSubmit, setBackgroundImage
} = useUIState()

const historyCallback = ref<((entries: Array<{ url: string; title: string; screenshot?: string }>) => void) | null>(null)

const { addEntry, updateScreenshot } = useHistory((entries) => historyCallback.value?.(entries))

function handleDriftAction(action: string, value?: string): void {
  switch (action) {
    case 'toggle-console-mode':
      toggleConsoleMode()
      break
    case 'toggle-auto-keyboard':
      toggleAutoKeyboard()
      break
    case 'pick-download-folder':
      pickDownloadFolder()
      break
    case 'quit':
      window.nova?.quit?.()
      break
    case 'open':
      if (value && typeof window.nova?.openDownload === 'function') {
        window.nova.openDownload(value)
      }
      break
    case 'clear-downloads':
      if (typeof window.nova?.clearDownloads === 'function') {
        window.nova.clearDownloads()
        activeTabId()
      }
      break
    case 'show-tutorial':
      handleNavigate(DRIFT_TUTORIAL_URI)
      break
    case 'set-language': {
      const next = currentLocale.value === 'es' ? 'en' : 'es'
      setLocale(next)
      try { window.nova?.setConfig?.({ locale: next }) } catch {}
      const id = activeTabId()
      if (id) {
        const wv = wvManager.getWebview(id)
        if (wv) {
          try { wv.loadURL(wv.getURL().replace(/#.*$/, '')) } catch { wv.loadURL(DRIFT_SETTINGS_URI) }
        }
      }
      break
    }
    case 'close':
      handleNavigate('')
      break
  }
}

function getDriftState() {
  return {
    consoleMode: consoleMode.value,
    autoKeyboard: autoKeyboard.value,
    downloadFolder: downloadFolder.value
  }
}

function activeTabId(): string | undefined {
  return tabsManager.activeTab.value?.id
}

const wvManager = useWebviewManager({
  tabs,
  updateTab: (tabId, patch) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) Object.assign(tab, patch)
  },
  addEntry,
  updateScreenshot,
  autoKeyboard,
  showKeyboard,
  showDownloads: ref(false),
  showOptions: ref(false),
  getDriftState,
  handleDriftAction
})

historyCallback.value = (entries) => {
  const homeTab = tabs.value.find(t => !t.url)
  if (homeTab) wvManager.pushHistoryToHome(homeTab.id, entries)
}

// const tabsManager = useTabsManager({
//   tabs,
//   addEntry,
//   getWebview: wvManager.getWebview,
//   webviewReady: wvManager.webviewReady,
//   pendingUrls: wvManager.pendingUrls
// })

const tabsManager = useTabsManager(tabs)

useAutoKeyboard({ autoKeyboard, showKeyboard })

useShortcuts({
  newTab: () => tabsManager.addTab(),
  closeTab: () => tabsManager.closeCurrentTab(),
  focusUrl: () => {},
  reload: handleReload, // Usamos los wrappers locales
  goHome: handleGoHome,
  goBack: handleGoBack,
  goForward: handleGoForward,
  toggleKeyboard: () => toggleKeyboard()
})

function handleNavigate(url: string): void {
  const id = activeTabId()
  if (id) wvManager.navigate(id, url)
}

function handleGoBack(): void {
  const id = activeTabId()
  if (id) wvManager.goBack(id)
}

function handleGoForward(): void {
  const id = activeTabId()
  if (id) wvManager.goForward(id)
}

function handleReload(): void {
  const id = activeTabId()
  if (id) wvManager.reloadTab(id)
}

function handleGoHome(): void {
  const id = activeTabId()
  if (id) wvManager.goHome(id)
}

function switchTab(id: string): void {
  showKeyboard.value = false
  tabsManager.switchTab(id)
}

function toggleConsoleMode(): void {
  consoleMode.value = !consoleMode.value
  if (consoleMode.value) {
    window.nova?.maximizeForce?.()
  }
  pushDriftStateToActive()
}

function openSettingsTab(): void {
  handleNavigate(DRIFT_SETTINGS_URI)
}

function openDownloadsTab(): void {
  handleNavigate(DRIFT_DOWNLOADS_URI)
}

function pushDriftStateToActive(): void {
  const id = activeTabId()
  if (id) wvManager.pushDriftState(id)
}

const { activeTab, visibleTabs } = tabsManager

const toolbarRef = ref<InstanceType<typeof Toolbar>>()

const downloadFolder = ref('')
const showConfirmQuit = ref(false)
const confirmQuitCount = ref(0)
const appReady = ref(false)
const favorites = ref<Array<{ name: string; url: string; domain?: string; icon?: string; bg?: string; image?: string }>>([])

const isFavorite = computed(() => {
  const url = activeTab.value?.url
  if (!url || url.startsWith('app-drift://') || url === 'about:blank') return false
  return favorites.value.some(f => f.url === url)
})

function toggleFavorite(): void {
  const tab = activeTab.value
  if (!tab || !tab.url || tab.url.startsWith('app-drift://') || tab.url === 'about:blank') return

  const idx = favorites.value.findIndex(f => f.url === tab.url)
  if (idx >= 0) {
    favorites.value.splice(idx, 1)
  } else {
    favorites.value.push({ name: tab.title || tab.url, url: tab.url })
  }

  if (typeof window.nova?.setFavorites === 'function') {
    window.nova.setFavorites(JSON.parse(JSON.stringify(favorites.value)))
  }

  const homeTab = tabs.value.find(t => !t.url)
  if (homeTab) {
    const wv = wvManager.getWebview(homeTab.id)
    if (wv) {
      wv.loadURL('app-home://home')
    }
  }
}

onMounted(async () => {
  await initLocale()
  if (typeof window.nova?.getDownloadFolder === 'function') {
    downloadFolder.value = await window.nova.getDownloadFolder()
  }
  if (typeof window.nova?.onConfirmQuit === 'function') {
    window.nova.onConfirmQuit((data: { count: number }) => {
      confirmQuitCount.value = data.count
      showConfirmQuit.value = true
    })
  }
  if (typeof window.nova?.getFirstLaunch === 'function') {
    const first = await window.nova.getFirstLaunch()
    if (first) {
      handleNavigate(DRIFT_TUTORIAL_URI)
      if (typeof window.nova?.dismissWelcome === 'function') {
        window.nova.dismissWelcome()
      }
    }
  }
  if (typeof window.nova?.onDownloadProgress === 'function') {
    window.nova.onDownloadProgress((data: { id: string; received: number; total: number }) => {
      const id = activeTabId()
      if (id) wvManager.pushDownloadProgress(id, data)
    })
  }
  if (typeof window.nova?.onDownloadDone === 'function') {
    window.nova.onDownloadDone((data: { id: string; path: string; success: boolean }) => {
      const id = activeTabId()
      if (id) wvManager.pushDownloadDone(id, data)
    })
  }
  if (typeof window.nova?.getFavorites === 'function') {
    favorites.value = await window.nova.getFavorites()
  }
  appReady.value = true
})

function cancelQuit(): void {
  showConfirmQuit.value = false
}

async function pickDownloadFolder(): Promise<void> {
  if (typeof window.nova?.pickDownloadFolder === 'function') {
    const folder = await window.nova.pickDownloadFolder()
    if (folder) {
      downloadFolder.value = folder
      pushDriftStateToActive()
    }
  }
}

function editUrl(): void {
  toolbarRef.value?.editUrl()
}

watch(tabs, (val) => {
  if (typeof window.nova?.updateTabs === 'function') {
    window.nova.updateTabs(val.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active })))
  }
}, { deep: true })

useGamepadActions({ 
  wvManager, 
  tabsManager, 
  showKeyboard, 
  showConfirmQuit, 
  autoKeyboard, 
  editUrl,
  goBack: handleGoBack,       // Pasamos la función real
  goForward: handleGoForward  // Pasamos la función real
})
</script>

<template>
  <div class="app-shell">
    <Toolbar
      ref="toolbarRef"
      :url="activeTab?.url || ''"
      :can-go-back="activeTab?.canGoBack || false"
      :can-go-forward="activeTab?.canGoForward || false"
      :is-loading="activeTab?.isLoading || false"
      :tabs="visibleTabs"
      :console-mode="consoleMode"
      :overlay-open="overlayOpen"
      :download-count="downloadCount"
      @navigate="handleNavigate"
      @go-back="handleGoBack"
      @go-forward="handleGoForward"
      @reload="handleReload"
      @go-home="handleGoHome"
      @new-tab="tabsManager.addTab"
      @close-tab="tabsManager.closeTab"
      @switch-tab="switchTab"
      @quit="() => window.nova?.quit?.()"
      @minimize="() => window.nova?.minimize?.()"
      @maximize="() => window.nova?.maximize?.()"
      @toggle-downloads="openDownloadsTab"
      @toggle-options="openSettingsTab"
      :favorite="isFavorite"
      @toggle-favorite="toggleFavorite"
    />
    <main class="content-area">
      <div class="webview-stack">
        <template v-for="tab in tabs" :key="tab?.id || Math.random()">
          
          <template v-if="tab">
            <LoadingOverlay :show="tab.active && tab.isLoading" />

            <webview
              v-show="tab.active"
              :ref="(el: any) => wvManager.setWebviewRef(tab.id, el)"
              class="webview"
              :lang="currentLocale"
            />
          </template>

        </template>
      </div>
    </main>
    <Keyboard
      v-show="showKeyboard"
      :get-active-webview="() => wvManager.getWebview(activeTab?.id || '')"
      @close="handleKeyboardSubmit"
      @submit="handleKeyboardSubmit"
    />
    <ConfirmQuitDialog
      v-if="showConfirmQuit"
      :count="confirmQuitCount"
      @close="cancelQuit"
    />
    <Transition name="fade">
      <div v-if="!appReady" class="app-loading">
        <div class="loading-logo">
          <img :src="iconPng" alt="PadBrowser" class="loading-icon" />
        </div>
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ t('app.loading') }}</p>
      </div>
    </Transition>
  </div>
</template>

<style>
:root {
  --toolbar-h: 80px;
  --tab-h: 56px;
  --btn-size: 64px;
  --btn-size-sm: 48px;
  --font-base: 24px;
  --font-lg: 32px;
  --font-xl: 48px;
  --radius: 12px;
  --radius-sm: 8px;
  --bg: #141026;
  --surface: #1d163a;
  --surface-hover: #28214d;
  --surface-active: #352d5a;
  --accent: #ff2255;
  --accent-dim: #c91b44;
  --text: #f0eef5;
  --text-dim: #b0aac8;
  --cyan: #00d4ff;
  --orange: #ff6a00;
  --danger: #ff2040;
  --focus-ring: 0 0 0 3px rgba(255, 34, 85, 0.7), 0 0 14px rgba(255, 34, 85, 0.3);
  --border: #2a2440;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: var(--font-base);
  user-select: none;
}

#app {
  height: 100%;
}

.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.webview-stack {
  width: 100%;
  height: 100%;
  position: relative;
}

.webview {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
}

button {
  cursor: pointer;
  border: none;
  outline: none;
  font-family: inherit;
  color: var(--text);
}

button:focus,
button:focus-visible {
  outline: none;
  box-shadow: none;
}

.toolbar-btn:focus-visible,
.close-btn:focus-visible,
.tab-item:focus-visible,
.filter-btn:focus-visible {
  background: rgba(232, 220, 224, 0.24);
  color: #ffffff;
}

input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.app-loading {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: var(--bg);
}

.loading-logo {
  color: var(--accent);
  opacity: 0.6;
  width: 100px;
  animation: loadingPulse 2s ease-in-out infinite;
}

.loading-icon {
  width: 100%;
  height: auto;
  display: block;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 34, 85, 0.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: var(--text-dim);
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes loadingPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.98); }
  50% { opacity: 0.8; transform: scale(1.02); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
