interface AppConfig {
  downloadFolder?: string
  backgroundImage?: string
  locale?: string
}

declare global {
  interface Window {
    nova: {
      quit: () => void
      minimize: () => void
      maximize: () => void
      maximizeForce: () => void
      isMaximized: () => Promise<boolean>
      onMaximized: (cb: () => void) => void
      onUnmaximized: (cb: () => void) => void
      getDownloads: () => Promise<Array<{ id: string; name: string; path: string; received: number; total: number; done: boolean }>>
      openDownload: (path: string) => void
      clearDownloads: () => void
      getDownloadFolder: () => Promise<string>
      pickDownloadFolder: () => Promise<string | null>
      onDownloadProgress: (cb: (data: { id: string; received: number; total: number }) => void) => void
      onDownloadDone: (cb: (data: { id: string; path: string; success: boolean }) => void) => void
      onDownloadCount: (cb: (data: { count: number }) => void) => void
      onConfirmQuit: (cb: (data: { count: number }) => void) => void
      quitConfirmed: () => void
      quitCancelled: () => void
      getConfig: () => Promise<AppConfig>
      setConfig: (config: Partial<AppConfig>) => void
      updateHistory: (entries: Array<{ url: string; title: string; screenshot?: string }>) => void
      updateTabs: (tabs: Array<{ id: string; title: string; url: string; active: boolean }>) => void
      getFirstLaunch: () => Promise<boolean>
      dismissWelcome: () => void
      getFavorites: () => Promise<Array<{ name: string; url: string; domain: string; icon: string; bg: string; image?: string }>>
      setFavorites: (favorites: Array<{ name: string; url: string; domain: string; icon: string; bg: string; image?: string }>) => void
    }
  }
}

export {}
