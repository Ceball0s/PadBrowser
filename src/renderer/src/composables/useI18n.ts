import { ref, computed } from 'vue'
import es from '../i18n/es.json'
import en from '../i18n/en.json'

type Lang = 'es' | 'en'

const locale = ref<Lang>('es')

const messages: Record<Lang, Record<string, any>> = { es, en }

function resolve(obj: Record<string, any>, path: string): string {
  const result = path.split('.').reduce((acc, key) => (acc as any)?.[key], obj)
  return typeof result === 'string' ? result : path
}

export async function initLocale(): Promise<void> {
  try {
    const cfg = await window.nova?.getConfig()
    if (cfg?.locale === 'en' || cfg?.locale === 'es') {
      locale.value = cfg.locale
    }
  } catch {
    // fallback to es
  }
}

export function useI18n() {
  function t(key: string, params?: Record<string, string | number>): string {
    let text = resolve(messages[locale.value], key)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }

  function setLocale(lang: Lang): void {
    locale.value = lang
  }

  const currentLocale = computed(() => locale.value)

  return { t, setLocale, currentLocale }
}
