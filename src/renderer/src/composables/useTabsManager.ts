import { computed, type Ref } from 'vue'

export interface Tab {
  id: string
  title: string
  url: string
  active: boolean
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
}

export function useTabsManager(tabs: Ref<Tab[]>) {
  let tabCounter = 1

  const activeTab = computed(() => tabs.value.find(t => t.active))
  
  const visibleTabs = computed(() => 
    tabs.value.map(t => ({ 
      id: t.id, 
      title: t.title, 
      url: t.url, 
      active: t.active, 
      isLoading: t.isLoading 
    }))
  )

  function updateTab(tabId: string, patch: Partial<Tab>): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) Object.assign(tab, patch)
  }

  function addTab(url?: string): void {
    tabCounter++
    const id = `tab-${tabCounter}`
    const newTab: Tab = {
      id,
      title: 'Nueva pestaña',
      url: url || '',
      active: true,
      canGoBack: false,
      canGoForward: false,
      isLoading: false
    }
    tabs.value.forEach(t => t.active = false)
    tabs.value.push(newTab)
  }

  function closeCurrentTab(): void {
    if (!activeTab.value || tabs.value.length <= 1) return
    closeTab(activeTab.value.id)
  }

  function closeTab(id: string): void {
    if (tabs.value.length <= 1) return
    const idx = tabs.value.findIndex(t => t.id === id)
    
    // Filtramos la pestaña eliminada
    tabs.value = tabs.value.filter(t => t.id !== id)
    
    // Reasignamos el foco a la adyacente
    const target = tabs.value[idx] || tabs.value[idx - 1]
    if (target) target.active = true
  }

  function switchTab(id: string): void {
    const tab = tabs.value.find(t => t.id === id)
    if (!tab) return
    tabs.value.forEach(t => t.active = false)
    tab.active = true
  }

  function switchToPrevTab(): void {
    const idx = tabs.value.findIndex(t => t.active)
    if (idx < 0) return
    const prev = tabs.value[idx - 1] || tabs.value[tabs.value.length - 1]
    if (prev) switchTab(prev.id)
  }

  function switchToNextTab(): void {
    const idx = tabs.value.findIndex(t => t.active)
    if (idx < 0) return
    const next = tabs.value[idx + 1] || tabs.value[0]
    if (next) switchTab(next.id)
  }

  return {
    tabs,
    activeTab,
    visibleTabs,
    updateTab,
    addTab,
    closeCurrentTab,
    closeTab,
    switchTab,
    switchToPrevTab,
    switchToNextTab
  }
}