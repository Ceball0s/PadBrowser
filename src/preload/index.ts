import { contextBridge, ipcRenderer } from 'electron'

const api = {
  quit: () => ipcRenderer.send('quit'),
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  maximizeForce: () => ipcRenderer.send('maximize-force'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  onMaximized: (cb: () => void) => {
    ipcRenderer.on('window-maximized', () => cb())
  },
  onUnmaximized: (cb: () => void) => {
    ipcRenderer.on('window-unmaximized', () => cb())
  },

  // Descargas
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  openDownload: (path: string) => ipcRenderer.send('open-download', path),
  clearDownloads: () => ipcRenderer.send('clear-downloads'),

  getDownloadFolder: () => ipcRenderer.invoke('get-download-folder'),
  pickDownloadFolder: () => ipcRenderer.invoke('pick-download-folder'),

  // Eventos de descarga desde main
  onDownloadProgress: (cb: (data: { id: string; received: number; total: number }) => void) => {
    ipcRenderer.on('download-progress', (_event, data) => cb(data))
  },
  onDownloadDone: (cb: (data: { id: string; path: string; success: boolean }) => void) => {
    ipcRenderer.on('download-done', (_event, data) => cb(data))
  },
  onDownloadCount: (cb: (data: { count: number }) => void) => {
    ipcRenderer.on('download-count', (_event, data) => cb(data))
  },

  // Confirmación de salida
  onConfirmQuit: (cb: (data: { count: number }) => void) => {
    ipcRenderer.on('confirm-quit', (_event, data) => cb(data))
  },
  quitConfirmed: () => ipcRenderer.send('quit-confirmed'),
  quitCancelled: () => ipcRenderer.send('quit-cancelled'),

  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config: Record<string, unknown>) => ipcRenderer.send('set-config', config),

  updateHistory: (entries: Array<{ url: string; title: string; screenshot?: string }>) => ipcRenderer.invoke('update-history', entries),

  updateTabs: (tabs: Array<{ id: string; title: string; url: string; active: boolean }>) => ipcRenderer.send('update-tabs', tabs),

  getFirstLaunch: () => ipcRenderer.invoke('get-first-launch'),
  dismissWelcome: () => ipcRenderer.send('dismiss-welcome'),

  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  setFavorites: (favorites: Array<{ name: string; url: string; domain: string; icon: string; bg: string; image?: string }>) => ipcRenderer.send('set-favorites', favorites)
}

contextBridge.exposeInMainWorld('nova', api)
