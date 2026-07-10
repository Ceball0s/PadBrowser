export interface HistoryEntry {
  url: string
  title: string
  timestamp: number
  type: 'page' | 'search'
  screenshot?: string
}

const STORAGE_KEY = 'padbrowser-history'

const globalHistory: HistoryEntry[] = loadHistory()

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalHistory))
  } catch {
    // localStorage might be full
  }
}

export function useHistory(onChange?: (entries: Array<{ url: string; title: string; screenshot?: string }>) => void) {
  function addEntry(url: string, title: string, type: 'page' | 'search' = 'page'): void {
    const idx = globalHistory.findIndex(e => e.url === url)
    const existing = idx !== -1 ? globalHistory[idx] : null
    if (idx !== -1) globalHistory.splice(idx, 1)
    globalHistory.unshift({ url, title, timestamp: Date.now(), type, screenshot: existing?.screenshot })
    if (globalHistory.length > 100) globalHistory.length = 100
    saveHistory()
    flushToMain()
    if (onChange) onChange(globalHistory.slice(0, 10).map(e => ({ url: e.url, title: e.title, screenshot: e.screenshot })))
  }

  function updateScreenshot(url: string, screenshot: string): void {
    const entry = globalHistory.find(e => e.url === url)
    if (entry) {
      entry.screenshot = screenshot
      saveHistory()
      flushToMain()
      if (onChange) onChange(globalHistory.slice(0, 10).map(e => ({ url: e.url, title: e.title, screenshot: e.screenshot })))
    }
  }

  function flushToMain(): void {
    if (typeof window.nova?.updateHistory === 'function') {
      window.nova.updateHistory(globalHistory.slice(0, 10).map(e => ({
        url: e.url,
        title: e.title,
        screenshot: e.screenshot
      })))
    }
  }

  function search(query: string): HistoryEntry[] {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    return globalHistory.filter(
      e => e.url.toLowerCase().includes(lower) || e.title.toLowerCase().includes(lower)
    ).slice(0, 10)
  }

  function getEntries(): Array<{ url: string; title: string; screenshot?: string }> {
    return globalHistory.slice(0, 10).map(e => ({ url: e.url, title: e.title, screenshot: e.screenshot }))
  }

  return { addEntry, updateScreenshot, search, getEntries }
}
