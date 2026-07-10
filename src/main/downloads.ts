import { app, BrowserWindow, dialog, shell, type DownloadItem } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { loadConfig } from './config'
import type { DownloadEntry } from './types'

let downloads: DownloadEntry[] = []
export const cancelState = { intentional: false }

export function getDownloads(): DownloadEntry[] {
  return downloads
}

export function addDownload(entry: DownloadEntry): void {
  downloads = [entry, ...downloads]
}

export function updateDownload(id: string, update: Partial<DownloadEntry>): void {
  downloads = downloads.map((item) => (item.id === id ? { ...item, ...update } : item))
}

export function clearDownloads(): void {
  downloads = []
}

export function removeDownload(id: string): void {
  downloads = downloads.filter((item) => item.id !== id)
}

export function setupDownloadHandlers(mainWindow: BrowserWindow): void {
  mainWindow.webContents.session.on('will-download', (_event, item: DownloadItem) => {
    const fileName = item.getFilename()
    const config = loadConfig()
    const downloadFolder = config.downloadFolder || app.getPath('downloads')
    const targetPath = join(downloadFolder, fileName)

    if (!existsSync(downloadFolder)) {
      mkdirSync(downloadFolder, { recursive: true })
    }

    const entry: DownloadEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: fileName,
      path: targetPath,
      received: 0,
      total: item.getTotalBytes() || 0,
      done: false,
      downloadItem: item
    }

    addDownload(entry)
    mainWindow.webContents.send('download-count', { count: downloads.filter((d) => !d.done).length })

    item.setSavePath(targetPath)

    item.on('updated', () => {
      updateDownload(entry.id, {
        received: item.getReceivedBytes(),
        total: item.getTotalBytes() || 0,
        done: item.getState() === 'completed'
      })
      mainWindow.webContents.send('download-progress', {
        id: entry.id,
        received: item.getReceivedBytes(),
        total: item.getTotalBytes() || 0
      })
      mainWindow.webContents.send('download-count', { count: downloads.filter((d) => !d.done).length })
    })

    item.once('done', (_event, state) => {
      updateDownload(entry.id, { done: state === 'completed' })
      mainWindow.webContents.send('download-done', {
        id: entry.id,
        path: targetPath,
        success: state === 'completed'
      })
      mainWindow.webContents.send('download-count', { count: downloads.filter((d) => !d.done).length })
      if (state !== 'completed' && !cancelState.intentional) {
        dialog.showErrorBox('Download failed', `The download of ${fileName} could not be completed.`)
      } else {
        void shell.openPath(targetPath)
      }
    })
  })
}
