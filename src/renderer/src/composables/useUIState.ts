import { ref, computed, onMounted } from 'vue'

export function useUIState() {
  const showKeyboard = ref(false)
  const consoleMode = ref(false)
  const autoKeyboard = ref(false)
  const downloadCount = ref(0)
  const backgroundImage = ref('home-bg.jpg')

  const overlayOpen = computed(() => showKeyboard.value)

  onMounted(async () => {
    if (typeof window.nova?.onDownloadCount === 'function') {
      window.nova.onDownloadCount((data: { count: number }) => {
        downloadCount.value = data.count
      })
    }
    if (typeof window.nova?.getConfig === 'function') {
      const cfg = await window.nova.getConfig()
      if (cfg.backgroundImage) backgroundImage.value = cfg.backgroundImage
    }
  })

  function toggleKeyboard(): void {
    showKeyboard.value = !showKeyboard.value
    if (!showKeyboard.value) {
      ;(document.activeElement as HTMLElement)?.blur()
    }
  }

  function toggleAutoKeyboard(): void {
    autoKeyboard.value = !autoKeyboard.value
    if (!autoKeyboard.value) showKeyboard.value = false
  }

  function handleKeyboardSubmit(): void {
    showKeyboard.value = false
    ;(document.activeElement as HTMLElement)?.blur()
  }

  async function setBackgroundImage(name: string): Promise<void> {
    backgroundImage.value = name
    if (typeof window.nova?.setConfig === 'function') {
      window.nova.setConfig({ backgroundImage: name })
    }
  }

  return {
    showKeyboard,
    consoleMode,
    autoKeyboard,
    downloadCount,
    backgroundImage,
    overlayOpen,
    toggleKeyboard,
    toggleAutoKeyboard,
    handleKeyboardSubmit,
    setBackgroundImage
  }
}
