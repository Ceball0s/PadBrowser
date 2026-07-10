import { type Ref, onMounted, onUnmounted } from 'vue'
import { useDpad } from './useDpad'
import { useGamepad } from './useGamepad'
import { getSpatialNavScript } from '../utils/webviewSpatialNav'
import { CHECK_ACTIVE_ELEMENT_IS_INPUT } from '../utils/injectorScripts'
import { createVirtualCursor } from '../utils/virtualCursor'

// En useGamepadActions.ts
interface GamepadDeps {
  wvManager: {
    getWebview: (tabId: string) => Electron.WebviewTag | undefined
  }
  tabsManager: {
    activeTab: { value: { id: string } | undefined }
    closeCurrentTab: () => void
    addTab: () => void
    switchTab: (id: string) => void
    switchToPrevTab: () => void
    switchToNextTab: () => void
  }
  showKeyboard: Ref<boolean>
  showConfirmQuit: Ref<boolean>
  autoKeyboard: Ref<boolean>
  editUrl: () => void
  goBack: () => void      // <-- Añadimos esto
  goForward: () => void   // <-- Añadimos esto
}

export function useGamepadActions(deps: GamepadDeps): void {
  const { moveFocus } = useDpad()

  const cursor = createVirtualCursor({
    getWebview: deps.wvManager.getWebview,
    getActiveTabId: () => deps.tabsManager.activeTab.value?.id
  })

  onMounted(() => {
    requestAnimationFrame(() => cursor.reset())
  })

  let navigatingWebview = false

  function getToolbarButtons(): HTMLElement[] {
    const toolbar = document.querySelector('.toolbar')
    if (!toolbar) return []
    return Array.from(toolbar.querySelectorAll<HTMLElement>('.toolbar-btn, .close-btn'))
      .filter(el => el.offsetParent !== null && !el.disabled)
  }

  function getKeyboardButtons(): HTMLElement[] {
    const kb = document.querySelector('.keyboard-overlay')
    if (!kb) return []
    return Array.from(kb.querySelectorAll<HTMLElement>('button:not([disabled])'))
      .filter(el => el.offsetParent !== null)
  }

  function focusKeyboardFirst(): void {
    const btns = getKeyboardButtons()
    btns[0]?.focus()
  }

  function moveKeyboard(dir: 'up' | 'down' | 'left' | 'right'): void {
    const btns = getKeyboardButtons()
    if (!btns.length) return
    const cur = document.activeElement as HTMLElement | null
    if (!cur || !btns.includes(cur)) { btns[0]?.focus(); return }

    const cr = cur.getBoundingClientRect()
    const cx = cr.left + cr.width / 2
    const cy = cr.top + cr.height / 2

    const isVertical = dir === 'up' || dir === 'down'

    let best: HTMLElement | null = null
    let bestDist = Infinity
    let bestFallback: HTMLElement | null = null
    let bestFallbackScore = Infinity

    for (const btn of btns) {
      if (btn === cur) continue
      const r = btn.getBoundingClientRect()
      const ecx = r.left + r.width / 2
      const ecy = r.top + r.height / 2
      const dx = ecx - cx
      const dy = ecy - cy

      if (dir === 'up' && dy >= 0) continue
      if (dir === 'down' && dy <= 0) continue
      if (dir === 'left' && dx >= 0) continue
      if (dir === 'right' && dx <= 0) continue

      const onAxis = isVertical
        ? cr.left < r.right && cr.right > r.left
        : cr.top < r.bottom && cr.bottom > r.top

      if (onAxis) {
        const dist = isVertical ? Math.abs(dy) : Math.abs(dx)
        if (dist < bestDist) {
          bestDist = dist
          best = btn
        }
      } else {
        const primaryDist = isVertical ? Math.abs(dy) : Math.abs(dx)
        const secondaryDist = isVertical ? Math.abs(dx) : Math.abs(dy)
        const score = primaryDist + secondaryDist * 5
        if (score < bestFallbackScore) {
          bestFallbackScore = score
          bestFallback = btn
        }
      }
    }

    ;(best || bestFallback)?.focus()
  }

  function focusToolbarFirst(): void {
    const btns = getToolbarButtons()
    btns[0]?.focus()
  }

  function focusToolbarLast(): void {
    const btns = getToolbarButtons()
    btns[btns.length - 1]?.focus()
  }
  
  function focusWebviewFirst(): void {
    const wv = deps.wvManager.getWebview(deps.tabsManager.activeTab.value?.id || '')
    if (!wv) return

    if (navigatingWebview) return
    navigatingWebview = true

    wv.focus()

    wv.executeJavaScript(getSpatialNavScript('down'))
      .catch(() => {})
      .finally(() => {
        navigatingWebview = false
      })
  }

  const stopGamepad = useGamepad({
    onDpad(dir) {
      cursor.hide()

      if (deps.showConfirmQuit.value) {
        moveFocus(dir)
        return
      }

      if (deps.showKeyboard.value) {
        const activeEl = document.activeElement as HTMLElement | null
        const inKeyboard = activeEl?.closest('.keyboard-overlay') !== null
        if (!inKeyboard) {
          focusKeyboardFirst()
        } else {
          moveKeyboard(dir)
        }
        return
      }

      const activeEl = document.activeElement as HTMLElement | null
      if (!activeEl || activeEl.tagName === 'BODY') {
        focusToolbarFirst()
        return
      }

      const inChrome = activeEl && (
        activeEl.closest('.toolbar') !== null ||
        activeEl.closest('.options-panel') !== null ||
        activeEl.closest('.downloads-panel') !== null
      )

      if (inChrome) {
        if (activeEl && activeEl.closest('.toolbar')) {
          const prev = document.activeElement
          moveFocus(dir, '.toolbar')
          if (document.activeElement === prev) {
            focusWebviewFirst()
          }
          return
        }

        moveFocus(dir)
        return
      }

      const wv = deps.wvManager.getWebview(deps.tabsManager.activeTab.value?.id || '')
      if (!wv) return

      if (navigatingWebview) return
      navigatingWebview = true

      wv.executeJavaScript(getSpatialNavScript(dir))
        .then((result: any) => {
          if (result?.edge === 'up') {
            focusToolbarFirst()
            return
          }
        }).catch((err) => {
          console.error("Error ejecutando spatial nav:", err)
        })
        .finally(() => {
          navigatingWebview = false
        })
    },

    onLeftStick(dx, dy) {
      cursor.move(dx, dy)
    },

    onL1: () => deps.tabsManager.switchToPrevTab(),
    onR1: () => deps.tabsManager.switchToNextTab(),
    onL2: () => deps.tabsManager.closeCurrentTab(),
    onR2: () => deps.tabsManager.addTab(),
    onSelect: () => {},

    onA: () => {
      if (cursor.isActive()) {
        cursor.click()
        return
      }

      const el = document.activeElement as HTMLElement | null

      if (el) {
        const tabItem = el.closest('.tab-item')
        if (tabItem) {
          const tabId = tabItem.getAttribute('data-tab-id')
          if (tabId) {
            deps.tabsManager.switchTab(tabId)
            return
          }
        }
      }

      if (el?.tagName === 'WEBVIEW') {
        const tabId = deps.tabsManager.activeTab.value?.id
        if (tabId) {
          const wv = deps.wvManager.getWebview(tabId)
          if (wv) {
            wv.executeJavaScript(CHECK_ACTIVE_ELEMENT_IS_INPUT).then((isInput: boolean) => {
              if (isInput && deps.autoKeyboard.value) {
                deps.showKeyboard.value = true
              } else {
                wv.executeJavaScript('document.activeElement?.click()').catch(() => {})
              }
            }).catch(() => {
              wv.executeJavaScript('document.activeElement?.click()').catch(() => {})
            })
          }
        }
        return
      }

      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        if (deps.autoKeyboard.value) {
          deps.showKeyboard.value = true
          setTimeout(() => {
            if (document.activeElement !== el) {
              (el as HTMLElement).focus()
            }
          }, 0)
          return
        }
      }

      el?.click()
    },

    onB: () => {
      if (deps.showConfirmQuit.value) {
        deps.showConfirmQuit.value = false
        window.nova?.quitCancelled?.()
        return
      }
      if (deps.showKeyboard.value) {
        deps.showKeyboard.value = false
      }

      // Reemplazamos deps.tabsManager.goBack() por:
      deps.goBack()
    },
    onY: () => deps.editUrl(),
    onX: () => {
      // Reemplazamos deps.tabsManager.goForward() por:
      deps.goForward()
    },

    onRightStick(dx, dy) {
      const wv = deps.wvManager.getWebview(deps.tabsManager.activeTab.value?.id || '')
      if (wv) wv.executeJavaScript(`window.scrollBy(${dx},${dy})`).catch(() => {})
    }
  })

  onUnmounted(() => {
    stopGamepad()
  })
}
