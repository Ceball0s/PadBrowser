import { type Ref } from 'vue'
import { FOCUS_TRACKER } from '../utils/injectorScripts'
import { HOMEPAGE_URI, DRIFT_SETTINGS_URI, DRIFT_DOWNLOADS_URI } from '../utils/homepageHtml'
  import type { Tab } from './useTabsManager'

export interface DriftState {
  consoleMode: boolean
  autoKeyboard: boolean
  downloadFolder: string
}

export function useWebviewManager(deps: {
  tabs: Ref<Tab[]>
  updateTab: (tabId: string, patch: Record<string, unknown>) => void
  addEntry: (url: string, title: string, type: 'page' | 'search') => void
  updateScreenshot: (url: string, screenshot: string) => void
  autoKeyboard: Ref<boolean>
  showKeyboard: Ref<boolean>
  showDownloads: Ref<boolean>
  showOptions: Ref<boolean>
  getDriftState?: () => DriftState
  handleDriftAction?: (action: string, value?: string) => void
}) {
  const webviews = new Map<string, Electron.WebviewTag>()
  const webviewReady = new Set<string>()
  const pendingUrls = new Map<string, string>()

  function getWebview(tabId: string): Electron.WebviewTag | undefined {
    return webviews.get(tabId)
  }

  function isDriftUrl(url: string): boolean {
    return url.startsWith('app-drift://')
  }

  function isInternalUrl(url: string): boolean {
    return !url || url === 'about:blank' || url === HOMEPAGE_URI || url.startsWith('app-drift://')
  }

  function setupWebviewListeners(tabId: string, wv: Electron.WebviewTag): void {
    const findTab = () => deps.tabs.value.find(t => t.id === tabId)

    const flushPendingUrl = (): void => {
      const pending = pendingUrls.get(tabId)
      if (!pending) return
      try {
        wv.loadURL(pending)
      } catch {
        // webview no listo
      }
      pendingUrls.delete(tabId)
    }

    wv.addEventListener('dom-ready', () => {
      webviewReady.add(tabId)
      flushPendingUrl()
      wv.executeJavaScript(FOCUS_TRACKER).catch(() => {})
    })
    wv.addEventListener('page-title-updated', (e) => {
      const tab = findTab()
      if (tab && e.title) {
        deps.updateTab(tabId, { title: e.title })
        if (!isInternalUrl(tab.url)) {
          deps.addEntry(tab.url, e.title, 'page')
        }
      }
    })
    wv.addEventListener('did-start-loading', () => {
      const tab = findTab()
      if (tab) deps.updateTab(tabId, { isLoading: true })
    })

    wv.addEventListener('did-stop-loading', () => {
      const tab = findTab()
      if (tab) {
        deps.updateTab(tabId, { isLoading: false })
        
        if (!tab.url || tab.url === 'about:blank' || isDriftUrl(tab.url)) return

        try {
          wv.capturePage().then((img: Electron.NativeImage) => {
            const thumbnail = img.resize({ width: 320 })
            const dataUrl = thumbnail.toDataURL()
            deps.updateScreenshot(tab.url, dataUrl)
          }).catch((err) => {
            console.warn("No se pudo capturar la página:", err)
          })
        } catch {
          // capturePage no disponible
        }
      }
    })

    wv.addEventListener('did-navigate', (e) => {
      const tab = findTab()
      if (tab) {
        const isHome = e.url === HOMEPAGE_URI || (!e.url || e.url === 'about:blank')
        deps.updateTab(tabId, {
          url: isHome ? '' : e.url,
          canGoBack: wv.canGoBack(),
          canGoForward: wv.canGoForward()
        })
      }
    })
    wv.addEventListener('did-navigate-in-page', (e) => {
      const tab = findTab()
      if (!tab || !e.isMainFrame) return
      deps.updateTab(tabId, { url: e.url })

      // Handle drift action hashes
      if (isDriftUrl(e.url)) {
        const hashMatch = e.url.match(/#action\/([\w-]+)(?:\/([^#]*))?/)
        if (hashMatch) {
          const action = hashMatch[1]
          const value = hashMatch[2] ? decodeURIComponent(hashMatch[2]) : undefined
          if (deps.handleDriftAction) {
            deps.handleDriftAction(action, value)
          }
          // Clear the hash
          wv.executeJavaScript('window.location.hash = ""').catch(() => {})
          // Update page state after a brief delay for state to settle
          setTimeout(() => {
            pushDriftState(tabId)
          }, 50)
        }
      }
    })

    wv.addEventListener('blur', () => {
      if (deps.autoKeyboard.value && deps.showKeyboard.value) {
        setTimeout(() => {
          const el = document.activeElement
          if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'WEBVIEW' && !el.closest?.('.keyboard-overlay'))) {
            deps.showKeyboard.value = false
          }
        }, 200)
      }
    })
  }

  function pushDriftState(tabId: string): void {
    const wv = webviews.get(tabId)
    if (!wv || !deps.getDriftState) return
    if (!webviewReady.has(tabId)) return
    const state = deps.getDriftState()
    wv.executeJavaScript(`window.__updateState(${JSON.stringify(state)})`).catch(() => {})
  }

  function pushDownloadsUpdate(tabId: string, list: unknown[]): void {
    const wv = webviews.get(tabId)
    if (!wv) return
    if (!webviewReady.has(tabId)) return
    wv.executeJavaScript(`window.__updateDownloads(${JSON.stringify(list)})`).catch(() => {})
  }

  function pushDownloadProgress(tabId: string, data: { id: string; received: number; total: number }): void {
    const wv = webviews.get(tabId)
    if (!wv) return
    if (!webviewReady.has(tabId)) return
    wv.executeJavaScript(`window.__updateDownloadProgress(${JSON.stringify(data)})`).catch(() => {})
  }

  function pushDownloadDone(tabId: string, data: { id: string; path: string; success: boolean }): void {
    const wv = webviews.get(tabId)
    if (!wv) return
    if (!webviewReady.has(tabId)) return
    wv.executeJavaScript(`window.__updateDownloadDone(${JSON.stringify(data)})`).catch(() => {})
  }

  function pushHistoryToHome(tabId: string, entries: Array<{ url: string; title: string; screenshot?: string }>): void {
    const wv = webviews.get(tabId)
    if (!wv) return
    if (!webviewReady.has(tabId)) return
    wv.executeJavaScript(`window.__updateHistory(${JSON.stringify(entries)})`).catch(() => {})
  }

  // ... (Toda la primera parte de tu código de useWebviewManager se mantiene igual)

  function setWebviewRef(tabId: string, el: Element | null): void {
    const wv = el as Electron.WebviewTag | null
    if (wv) {
      if (!webviews.has(tabId)) {
        webviews.set(tabId, wv)
        setupWebviewListeners(tabId, wv)
      }
      
      if (!wv.src) {
        const tab = deps.tabs.value.find(t => t.id === tabId)
        if (tab && !tab.url) {
          pendingUrls.set(tabId, HOMEPAGE_URI)
        }
        wv.src = 'about:blank'
      }
    } else {
      webviews.delete(tabId)
    }
  }

  function loadUrlInWebview(tabId: string, url: string): void {
    const wv = getWebview(tabId)
    if (!wv) {
      pendingUrls.set(tabId, url)
      return
    }
    if (webviewReady.has(tabId)) {
      try {
        wv.loadURL(url)
      } catch {
        pendingUrls.set(tabId, url)
      }
    } else {
      pendingUrls.set(tabId, url)
    }
  }

  function navigate(tabId: string, url: string): void {
    const tab = deps.tabs.value.find(t => t.id === tabId)
    if (!tab) return

    if (!url) {
      deps.updateTab(tabId, { url: '', title: 'Inicio' })
      loadUrlInWebview(tabId, HOMEPAGE_URI)
      return
    }

    deps.updateTab(tabId, { url, title: url })
    deps.addEntry(url, url, 'page')

    const wv = getWebview(tabId)
    if (!wv) return

    if (webviewReady.has(tabId)) {
      try {
        wv.loadURL(url)
      } catch {
        // webview no listo
      }
    } else {
      pendingUrls.set(tabId, url)
      window.setTimeout(() => {
        if (pendingUrls.get(tabId) === url) {
          try {
            wv.loadURL(url)
          } catch {
            // webview no listo
          }
          pendingUrls.delete(tabId)
        }
      }, 400)
    }
  }

  function goBack(tabId: string): void {
    try {
      const wv = getWebview(tabId)
      if (!wv) return

      wv.executeJavaScript('window.history.back()').catch(() => {
        if (wv.canGoBack()) {
          wv.goBack()
        } else {
          wv.loadURL(HOMEPAGE_URI)
        }
      })
    } catch {
      // webview no listo
    }
  }

  function goForward(tabId: string): void {
    try {
      const wv = getWebview(tabId)
      if (!wv) return

      wv.executeJavaScript('window.history.forward()').catch(() => {
        if (wv.canGoForward()) wv.goForward()
      })
    } catch {
      // webview no listo
    }
  }

  function reloadTab(tabId: string): void {
    try {
      const wv = getWebview(tabId)
      if (wv) wv.reload()
    } catch {
      // webview no listo
    }
  }

  function goHome(tabId: string): void {
    deps.updateTab(tabId, { url: '', title: 'Inicio' })
    loadUrlInWebview(tabId, HOMEPAGE_URI)
  }

  return {
    webviews,
    webviewReady,
    pendingUrls,
    setWebviewRef,
    getWebview,
    pushDriftState,
    pushDownloadsUpdate,
    pushDownloadProgress,
    pushDownloadDone,
    pushHistoryToHome,
    // Exportamos los métodos de navegación
    navigate,
    goBack,
    goForward,
    reloadTab,
    goHome
  }
}