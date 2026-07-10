<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

defineProps<{
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  goBack: []
  goForward: []
  reload: []
  goHome: []
}>()
</script>

<template>
  <button
    class="toolbar-btn home-btn"
    @click="emit('goHome')"
    :title="t('nav.home')"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  </button>
  <button
    class="toolbar-btn"
    :disabled="!canGoBack"
    @click="emit('goBack')"
    :title="t('nav.back')"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  </button>
  <button
    class="toolbar-btn"
    :disabled="!canGoForward"
    @click="emit('goForward')"
    :title="t('nav.forward')"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  </button>
  <button
    class="toolbar-btn"
    @click="emit('reload')"
    :class="{ loading: isLoading }"
    :title="t('nav.reload')"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2-8.12L23 10" />
    </svg>
  </button>
</template>

<style scoped>
.toolbar-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--text);
  cursor: pointer;
  transition: all 0.12s ease;
  flex-shrink: 0;
  padding: 0;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(210, 200, 230, 0.14);
}

.toolbar-btn:active:not(:disabled) {
  background: rgba(210, 200, 230, 0.22);
}

.toolbar-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.toolbar-btn svg {
  width: 20px;
  height: 20px;
}

.toolbar-btn:focus-visible {
  outline: none;
  box-shadow: none;
  background: rgba(232, 220, 224, 0.24);
  color: #ffffff;
}

.toolbar-btn.loading svg {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
