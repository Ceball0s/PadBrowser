<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps<{
  isMaximized: boolean
  consoleMode: boolean
}>()

const emit = defineEmits<{
  minimize: []
  maximize: []
  quit: []
}>()

const timeStr = ref('')

let timer: ReturnType<typeof setInterval> | null = null

function updateTime(): void {
  const now = new Date()
  timeStr.value = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="window-controls">
    <template v-if="consoleMode">
      <span class="console-clock">{{ timeStr }}</span>
    </template>
    <template v-else>
      <button
        class="toolbar-btn"
        @click="emit('minimize')"
        :title="t('windowControls.minimize')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        class="toolbar-btn"
        :title="isMaximized ? t('windowControls.restore') : t('windowControls.maximize')"
        @click="emit('maximize')"
      >
        <svg v-if="!isMaximized" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="6" y="6" width="12" height="12" />
        </svg>

        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
          <rect x="5" y="11" width="8" height="8" />
          <path d="M9 11V5h8v8h-6" />
        </svg>
      </button>
    </template>

    <button
      class="close-btn"
      @click="emit('quit')"
      :title="t('windowControls.close')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.window-controls {
  display: flex;
  align-items: stretch;
  height: 100%;
  gap: 0;
}

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
  transition: all 0.12s;
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: rgba(210, 200, 230, 0.14);
}

.toolbar-btn:active {
  background: rgba(210, 200, 230, 0.22);
}

.toolbar-btn:focus-visible {
  background: rgba(232, 220, 224, 0.24);
  box-shadow: none;
  outline: none;
  color: #ffffff;
}

.toolbar-btn svg {
  width: 20px;
  height: 20px;
}

.close-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0;
  color: var(--text); /* Color normal en lugar de rojizo */
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(210, 200, 230, 0.14); /* Mismo fondo gris que los demás */
}

.close-btn:active {
  background: rgba(210, 200, 230, 0.22);
}

.close-btn:focus-visible {
  background: rgba(232, 220, 224, 0.24);
  box-shadow: none;
  outline: none;
  color: #ffffff;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.console-clock {
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dim);
  letter-spacing: 1px;
  padding: 0 16px;
  font-variant-numeric: tabular-nums;
}
</style>
