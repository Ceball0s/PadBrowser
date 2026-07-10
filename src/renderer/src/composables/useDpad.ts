export function useDpad(): {
  focusToolbarNext: () => void
  focusToolbarPrev: () => void
  moveFocus: (dir: 'left' | 'right' | 'up' | 'down', scopeSelector?: string) => void
} {
  const focusableSelector = 'button, input, [tabindex]:not([tabindex="-1"])'

  function getToolbarElements(): HTMLElement[] {
    return getFocusableElements('.toolbar').filter(el => el.classList.contains('toolbar-btn') || el.classList.contains('close-btn'))
  }

  function getFocusableElements(scopeSelector?: string): HTMLElement[] {
    const root = scopeSelector ? document.querySelector(scopeSelector) : document
    const elements = root
      ? (root === document
        ? Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
        : Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)))
      : []

    return elements.filter(el => el.offsetParent !== null && !el.disabled)
  }

  function getCurrentIndex(els: HTMLElement[]): number {
    const active = document.activeElement as HTMLElement
    return els.indexOf(active)
  }

  function moveFocus(direction: 'left' | 'right' | 'up' | 'down', scopeSelector?: string): void {
    const els = getFocusableElements(scopeSelector)
    if (els.length === 0) return

    const currentIdx = getCurrentIndex(els)
    if (currentIdx === -1) {
      els[0]?.focus()
      return
    }

    const current = els[currentIdx]
    const cr = current.getBoundingClientRect()
    const cx = cr.left + cr.width / 2
    const cy = cr.top + cr.height / 2
    const isVertical = direction === 'up' || direction === 'down'

    let best: HTMLElement | null = null
    let bestDist = Infinity
    let bestFallback: HTMLElement | null = null
    let bestFallbackScore = Infinity

    for (let i = 0; i < els.length; i++) {
      if (i === currentIdx) continue
      const r = els[i].getBoundingClientRect()
      const ecx = r.left + r.width / 2
      const ecy = r.top + r.height / 2
      const dx = ecx - cx
      const dy = ecy - cy

      if (direction === 'left' && dx >= 0) continue
      if (direction === 'right' && dx <= 0) continue
      if (direction === 'up' && dy >= 0) continue
      if (direction === 'down' && dy <= 0) continue

      const onAxis = isVertical
        ? cr.left < r.right && cr.right > r.left
        : cr.top < r.bottom && cr.bottom > r.top

      const primaryDist = isVertical ? Math.abs(dy) : Math.abs(dx)
      const secondaryDist = isVertical ? Math.abs(dx) : Math.abs(dy)

      if (onAxis) {
        if (primaryDist < bestDist) {
          bestDist = primaryDist
          best = els[i]
        }
      } else {
        const score = primaryDist + secondaryDist * 5
        if (score < bestFallbackScore) {
          bestFallbackScore = score
          bestFallback = els[i]
        }
      }
    }

    ;(best || bestFallback)?.focus()
  }

  function focusToolbarNext(): void {
    const els = getToolbarElements()
    if (!els.length) return
    const active = document.activeElement as HTMLElement
    const idx = els.indexOf(active)
    const next = els[idx + 1] || els[0]
    next?.focus()
  }

  function focusToolbarPrev(): void {
    const els = getToolbarElements()
    if (!els.length) return
    const active = document.activeElement as HTMLElement
    const idx = els.indexOf(active)
    const prev = els[idx - 1] || els[els.length - 1]
    prev?.focus()
  }

  function handleKeydown(e: KeyboardEvent): void {
    const confirmDialog = document.querySelector('.quit-dialog-backdrop')
    if (confirmDialog) return

    const inInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
    const kb = document.querySelector('.keyboard-overlay')
    const kbVisible = kb && window.getComputedStyle(kb).display !== 'none'

    if (inInput) {
      if (e.key === 'Escape') {
        ;(e.target as HTMLElement).blur()
        return
      }
      if (kbVisible && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
        e.preventDefault()
        const firstBtn = document.querySelector<HTMLElement>('.keyboard-overlay .key-btn')
        firstBtn?.focus()
        return
      }
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus('left')
        break
      case 'ArrowRight':
        e.preventDefault()
        moveFocus('right')
        break
      case 'ArrowUp':
        e.preventDefault()
        moveFocus('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        moveFocus('down')
        break
      case 'Enter':
        {
          const el = document.activeElement as HTMLElement
          el?.click()
        }
        break
    }
  }

  window.addEventListener('keydown', handleKeydown)

  return { focusToolbarNext, focusToolbarPrev, moveFocus }
}
