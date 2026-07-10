import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { clearDownloads, getDownloads, cancelState } from './downloads'
import { DEFAULT_FAVORITES, loadConfig, saveConfig } from './config'

import type { AppConfig, HistoryEntry, OpenTabEntry } from './types'

export const quitState = { inProgress: false }
let recentHistory: HistoryEntry[] = []

export function getRecentHistory(): HistoryEntry[] {
  return recentHistory
}
let openTabs: OpenTabEntry[] = []

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.on('quit', () => {
    const active = getDownloads().filter((d) => !d.done)
    if (active.length > 0) {
      mainWindow.webContents.send('confirm-quit', { count: active.length })
    } else {
      quitState.inProgress = true
      app.quit()
    }
  })

  ipcMain.on('quit-confirmed', () => {
    const active = getDownloads().filter((d) => !d.done)
    cancelState.intentional = true
    quitState.inProgress = true
    active.forEach((d) => d.downloadItem?.cancel())
    app.quit()
  })

  ipcMain.on('quit-cancelled', () => undefined)
  ipcMain.on('minimize', () => mainWindow.minimize())
  ipcMain.on('maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.handle('is-maximized', () => mainWindow.isMaximized())
  ipcMain.on('maximize-force', () => mainWindow.maximize())

  ipcMain.handle('get-config', () => loadConfig())
  ipcMain.on('set-config', (_event, config: Partial<AppConfig>) => {
    saveConfig(config)
  })
  ipcMain.handle('save-config', (_event, config: Partial<AppConfig>) => {
    saveConfig(config)
    return loadConfig()
  })

  ipcMain.handle('get-downloads', () => getDownloads().map((d) => ({ id: d.id, name: d.name, path: d.path, received: d.received, total: d.total, done: d.done })))
  ipcMain.on('clear-downloads', () => clearDownloads())
  ipcMain.on('open-download', (_event, filePath: string) => {
    if (filePath) {
      void shell.openPath(filePath)
    }
  })
  ipcMain.handle('get-download-folder', () => {
    const config = loadConfig()
    return config.downloadFolder || app.getPath('downloads')
  })
  ipcMain.handle('pick-download-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Seleccionar carpeta de descargas',
      properties: ['openDirectory']
    })
    if (!result.canceled && result.filePaths[0]) {
      saveConfig({ downloadFolder: result.filePaths[0] })
      return result.filePaths[0]
    }
    return null
  })

  ipcMain.handle('get-first-launch', () => {
    const cfg = loadConfig()
    return cfg.firstLaunch !== false
  })
  ipcMain.on('dismiss-welcome', () => {
    saveConfig({ firstLaunch: false })
  })
  ipcMain.handle('get-favorites', () => {
    const cfg = loadConfig()
    return cfg.favorites || DEFAULT_FAVORITES
  })
  ipcMain.on('set-favorites', (_event, favorites: AppConfig['favorites']) => {
    saveConfig({ favorites })
  })

  ipcMain.handle('get-history', () => recentHistory)
  ipcMain.handle('get-open-tabs', () => openTabs)
  ipcMain.handle('add-history', (_event, history: HistoryEntry) => {
    recentHistory = [history, ...recentHistory].slice(0, 10)
    return recentHistory
  })
  ipcMain.handle('add-open-tab', (_event, tab: OpenTabEntry) => {
    openTabs = [tab, ...openTabs.filter((entry) => entry.id !== tab.id)].slice(0, 10)
    return openTabs
  })
  ipcMain.handle('remove-open-tab', (_event, id: string) => {
    openTabs = openTabs.filter((entry) => entry.id !== id)
    return openTabs
  })
  ipcMain.handle('update-history', (_event, entries: HistoryEntry[]) => {
    recentHistory = entries.slice(0, 10)
    return recentHistory
  })
  ipcMain.handle('update-tabs', (_event, tabs: OpenTabEntry[]) => {
    openTabs = tabs.slice(0, 10)
    return openTabs
  })

  ipcMain.handle('toggle-devtools', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools()
    } else {
      mainWindow.webContents.openDevTools()
    }
  })
  ipcMain.handle('open-external', (_event, url: string) => {
    void shell.openExternal(url)
  })
}
