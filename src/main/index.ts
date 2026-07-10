import { app, BrowserWindow, protocol, shell } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import { setupDownloadHandlers } from './downloads'
import { setupIpcHandlers, quitState, getRecentHistory } from './ipc'
import { loadConfig } from './config'
import { getDownloads } from './downloads'
import { DEFAULT_FAVORITES } from './config'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: false,
    frame: false,
    autoHideMenuBar: true,
    title: 'PadBrowser',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized')
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-unmaximized')
  })

  mainWindow.on('close', (e) => {
    if (!mainWindow || quitState.inProgress) return
    e.preventDefault()
    const active = getDownloads().filter((d) => !d.done)
    if (active.length > 0) {
      mainWindow.webContents.send('confirm-quit', { count: active.length })
    } else {
      quitState.inProgress = true
      mainWindow.close()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function pagesDir(): string {
  return join(__dirname, '../pages')
}

function injectInitData(html: string, data: unknown): string {
  const json = JSON.stringify(data)
  return html.replace(
    /<script id="init-data" type="application\/json">[^<]*<\/script>/,
    `<script id="init-data" type="application/json">${json}</script>`
  )
}

function injectI18nData(html: string, locale: string): string {
  let translations: Record<string, unknown> = {}
  try {
    const i18nDir = join(__dirname, '../../src/renderer/src/i18n')
    translations = JSON.parse(readFileSync(join(i18nDir, `${locale}.json`), 'utf-8'))
  } catch {
    try {
      const i18nDir = join(__dirname, '../../src/renderer/src/i18n')
      translations = JSON.parse(readFileSync(join(i18nDir, 'es.json'), 'utf-8'))
    } catch {
      // fallback: empty
    }
  }
  const json = JSON.stringify(translations)
  const script = `<script>window.__translations=${json};window.__t=function(k){var p=k.split('.'),o=window.__translations;for(var i=0;i<p.length;i++){if(o===null||o===undefined)return k;o=o[p[i]];if(o===undefined)return k}return typeof o==='string'?o:k};document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('[data-i18n]').forEach(function(el){var k=el.getAttribute('data-i18n');var v=window.__t(k);if(v!==k)el.textContent=v});document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){var k=el.getAttribute('data-i18n-placeholder');var v=window.__t(k);if(v!==k)el.setAttribute('placeholder',v)});document.querySelectorAll('[data-i18n-title]').forEach(function(el){var k=el.getAttribute('data-i18n-title');var v=window.__t(k);if(v!==k)el.setAttribute('title',v)});document.querySelectorAll('[data-i18n-arialabel]').forEach(function(el){var k=el.getAttribute('data-i18n-arialabel');var v=window.__t(k);if(v!==k)el.setAttribute('aria-label',v)})});</script>`
  return html.replace('</head>', script + '</head>')
}

function servePage(page: string, data: unknown, locale?: string): Response {
  try {
    let html = readFileSync(join(pagesDir(), page), 'utf-8')
    html = injectInitData(html, data)
    html = injectI18nData(html, locale || 'es')
    return new Response(html, { headers: { 'content-type': 'text/html' } })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}

app.whenReady().then(() => {
  protocol.handle('app-home', (request) => {
    if (request.url === 'app-home://home') {
      const cfg = loadConfig()
      const recentHistory = getRecentHistory()
      return servePage('home.html', {
        favorites: cfg.favorites || DEFAULT_FAVORITES,
        backgroundImage: cfg.backgroundImage || 'home-bg.jpg',
        recentHistory: recentHistory.map(e => ({ url: e.url, title: e.title, screenshot: e.screenshot }))
      }, cfg.locale || 'es')
    }
    return new Response('Not Found', { status: 404 })
  })

  protocol.handle('app-drift', (request) => {
    const url = request.url
    const cfg = loadConfig()
    if (url === 'app-drift://settings') {
      return servePage('settings.html', {
        consoleMode: false,
        autoKeyboard: false,
        backgroundImage: cfg.backgroundImage || 'home-bg.jpg',
        downloadFolder: cfg.downloadFolder || ''
      }, cfg.locale || 'es')
    }
    if (url === 'app-drift://downloads') {
      return servePage('downloads.html', getDownloads().map((d) => ({ id: d.id, name: d.name, path: d.path, received: d.received, total: d.total, done: d.done })), cfg.locale || 'es')
    }
    if (url === 'app-drift://tutorial') {
      return servePage('tutorial.html', {}, cfg.locale || 'es')
    }
    return new Response('Not Found', { status: 404 })
  })

  createWindow()
  if (mainWindow) {
    setupDownloadHandlers(mainWindow)
    setupIpcHandlers(mainWindow)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})