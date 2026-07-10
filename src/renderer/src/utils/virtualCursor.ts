interface CursorDeps {
  getWebview: (tabId: string) => Electron.WebviewTag | undefined
  getActiveTabId: () => string | undefined
}

function getContainer(): HTMLElement | null {
  return document.querySelector('.content-area')
}

function getBounds(): { width: number; height: number } {
  const el = document.querySelector('.webview-stack') as HTMLElement | null
  if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return { width: 0, height: 0 }
  return { width: el.clientWidth, height: el.clientHeight }
}

function ensureCursor(): HTMLElement | null {
  let c = document.getElementById('__gp_cursor__')
  if (!c) {
    const container = getContainer()
    if (!container) return null
    c = document.createElement('div')
    c.id = '__gp_cursor__'
    c.style.cssText = 'position:absolute;top:0;left:0;width:28px;height:28px;pointer-events:none;z-index:2147483647;opacity:0;transition:opacity .15s;will-change:transform'
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><polygon points="3,3 21,13 15,14 18.5,23 16,24 12.5,17 3,21" fill="white" stroke="#222" stroke-width="1.8" stroke-linejoin="round"/></svg>'
    container.appendChild(c)
  }
  return c
}

function cursorStyle(x: number, y: number, vis: boolean): string {
  return `translate(${Math.round(x)}px,${Math.round(y)}px)`
}

function updateCursor(x: number, y: number, vis: boolean): void {
  const c = ensureCursor()
  if (c) {
    c.style.transform = cursorStyle(x, y, vis)
    c.style.opacity = vis ? '1' : '0'
  }
}

export function createVirtualCursor(deps: CursorDeps) {
  let x = 0
  let y = 0
  let visible = false
  let hideTimeout: ReturnType<typeof setTimeout> | null = null
  const HIDE_DELAY = 1500
  const CURSOR_SIZE = 28

  function show(): void {
    visible = true
    updateCursor(x, y, true)
    if (hideTimeout) clearTimeout(hideTimeout)
    hideTimeout = setTimeout(() => hide(), HIDE_DELAY)
  }

  function hide(): void {
    visible = false
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    updateCursor(x, y, false)
  }

  function reset(): void {
    const b = getBounds()
    if (b.width === 0 || b.height === 0) {
      updateCursor(0, 0, false)
      return
    }
    x = Math.round(b.width / 2)
    y = Math.round(b.height / 2)
    updateCursor(x, y, visible)
  }

  function move(dx: number, dy: number): void {
    const b = getBounds()
    if (b.width === 0 || b.height === 0) return

    x = Math.max(0, Math.min(b.width - CURSOR_SIZE, x + dx))
    y = Math.max(0, Math.min(b.height - CURSOR_SIZE, y + dy))
  
    const id = deps.getActiveTabId()
    if (id) {
      const wv = deps.getWebview(id)
      if (wv) {
        wv.sendInputEvent({ type: 'mouseMove', x: Math.round(x), y: Math.round(y) } as any)
      }
    }
    show()
  }

  function click(): void {
    const id = deps.getActiveTabId()
    if (!id) return
    const wv = deps.getWebview(id)
    if (!wv) return

    const px = Math.round(x)
    const py = Math.round(y)
    wv.sendInputEvent({ type: 'mouseDown', x: px, y: py, button: 'left', clickCount: 1 } as any)
    wv.sendInputEvent({ type: 'mouseUp', x: px, y: py, button: 'left', clickCount: 1 } as any)
  }

  function isActive(): boolean {
    return visible
  }

  return { move, click, reset, show, hide, isActive }
}
