export function useShortcuts(handlers: {
  newTab: () => void
  closeTab: () => void
  focusUrl: () => void
  reload: () => void
  goHome: () => void
  goBack: () => void
  goForward: () => void
  toggleKeyboard: () => void
}): void {
  function handleKeydown(e: KeyboardEvent): void {
    const mod = e.ctrlKey || e.metaKey

    if (mod && e.key === 't') {
      e.preventDefault()
      handlers.newTab()
    } else if (mod && e.key === 'w') {
      e.preventDefault()
      handlers.closeTab()
    } else if (mod && e.key === 'l') {
      e.preventDefault()
      handlers.focusUrl()
    } else if (e.key === 'F5' || (mod && e.key === 'r')) {
      e.preventDefault()
      handlers.reload()
    } else if (e.key === 'Escape') {
      handlers.goHome()
    } else if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
      handlers.goBack()
    } else if (e.altKey && e.key === 'ArrowRight') {
      handlers.goForward()
    } else if (e.key === 'F1') {
      e.preventDefault()
      handlers.toggleKeyboard()
    }
  }

  window.addEventListener('keydown', handleKeydown)
}
