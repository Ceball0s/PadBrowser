export interface FavoriteSite {
  name: string
  url: string
  domain?: string
  icon?: string
  bg?: string
  image?: string
  accent?: string
  accentGlow?: string
}

export interface AppConfig {
  downloadFolder?: string
  backgroundImage?: string
  firstLaunch?: boolean
  favorites?: FavoriteSite[]
  locale?: string
}

export interface DownloadEntry {
  id: string
  name: string
  path: string
  received: number
  total: number
  done: boolean
  downloadItem?: Electron.DownloadItem
}

export interface HistoryEntry {
  url: string
  title: string
  screenshot?: string
}

export interface OpenTabEntry {
  id: string
  title: string
  url: string
  active: boolean
}
