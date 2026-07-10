import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { app } from 'electron'
import type { AppConfig, FavoriteSite } from './types'

const CONFIG_PATH = join(app.getPath('userData'), 'config.json')

export const DEFAULT_FAVORITES: FavoriteSite[] = [
  {
    "name": "YouTube",
    "url": "https://youtube.com",
    "image": "https://cdn2.steamgriddb.com/thumb/5abf35c5c2942fe61d26936a6846c5be.jpg",
    "accent": "#ff0000",
    "accentGlow": "rgba(255, 0, 0, 0.45)"
  },
  {
    "name": "Prime Video",
    "url": "https://primevideo.com",
    "image": "https://cdn2.steamgriddb.com/thumb/10c8f12e1fb3ed73b09ec0311a269a42.jpg",
    "accent": "#00a8e1",
    "accentGlow": "rgba(0, 168, 225, 0.45)"
  },
  {
    "name": "Netflix",
    "url": "https://netflix.com",
    "image": "https://cdn2.steamgriddb.com/thumb/675c8e63d3d9cdbd3af716b4a5a371be.jpg",
    "accent": "#e50914",
    "accentGlow": "rgba(229, 9, 20, 0.45)"
  },
  {
    "name": "Max",
    "url": "https://max.com",
    "image": "https://cdn2.steamgriddb.com/thumb/27d049f461720c8fbc869279e7da7e41.jpg",
    "accent": "#002be7",
    "accentGlow": "rgba(0, 43, 231, 0.45)"
  },
  {
    "name": "Twitch",
    "url": "https://twitch.tv",
    "image": "https://cdn2.steamgriddb.com/thumb/43b0ede81ad6ac697a55c506e93e3075.jpg",
    "accent": "#9146ff",
    "accentGlow": "rgba(145, 70, 255, 0.45)"
  },
  {
    "name": "Kodi Media Center",
    "url": "http://localhost:8080",
    "image": "https://cdn2.steamgriddb.com/thumb/a92ab72c9f6093ab1488d54b96aff511.jpg",
    "accent": "#17B2E7",
    "accentGlow": "rgba(23, 178, 231, 0.45)"
  }
]

export function loadConfig(): AppConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveConfig(config: Partial<AppConfig>): void {
  try {
    const current = loadConfig()
    writeFileSync(CONFIG_PATH, JSON.stringify({ ...current, ...config }, null, 2))
  } catch {
    // ignore
  }
}
