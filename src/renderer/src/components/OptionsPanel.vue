<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps<{
  consoleMode: boolean
  autoKeyboard: boolean
  downloadFolder: string
  backgroundImage: string
}>()

const emit = defineEmits<{
  close: []
  toggleConsoleMode: []
  toggleAutoKeyboard: []
  pickDownloadFolder: []
  setBackground: [name: string]
  quit: []
}>()

function selectBackground(): void {
  const list = ['home-bg.jpg']
  const current = props.backgroundImage
  const idx = list.indexOf(current)
  const next = list[(idx + 1) % list.length]
  emit('setBackground', next)
}
</script>

<template>
  <div class="options-panel">
    <div class="options-header">
      <button class="close-btn" @click="emit('close')" :title="t('options.close')">
        <h2>{{ t('options.title') }}</h2>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="options-body">
      <button class="option-row" @click="emit('close')">
        <span class="option-label">{{ t('options.language') }}</span>
        <span class="option-value">{{ t('options.spanish') }}</span>
      </button>

      <button class="option-row" @click="selectBackground">
        <span class="option-label">{{ t('options.wallpaper') }}</span>
        <span class="option-value">{{ backgroundImage }}</span>
      </button>

      <button class="option-row" @click="emit('toggleAutoKeyboard')">
        <span class="option-label">{{ t('options.virtualKeyboard') }}</span>
        <span class="option-value" :class="{ active: autoKeyboard }">
          {{ autoKeyboard ? t('options.on') : t('options.off') }}
        </span>
      </button>

      <button class="option-row" @click="emit('toggleConsoleMode')">
        <span class="option-label">{{ t('options.consoleMode') }}</span>
        <span class="option-value" :class="{ active: consoleMode }">
          {{ consoleMode ? t('options.on') : t('options.off') }}
        </span>
      </button>

      <button class="option-row" @click="emit('pickDownloadFolder')">
        <span class="option-label">{{ t('options.downloadFolder') }}</span>
        <span class="option-value folder-path">{{ downloadFolder }}</span>
      </button>
    </div>

    <div class="options-footer">
      <button class="quit-btn" @click="emit('quit')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {{ t('options.quit') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.options-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.options-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.close-btn {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover,
.close-btn:focus-visible {
  background: rgba(210, 200, 230, 0.14);
}

.close-btn h2 {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text);
}

.close-btn svg {
  width: 28px;
  height: 28px;
  color: var(--text-dim);
}

.options-body {
  flex: 1;
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: var(--surface);
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-size: var(--font-base);
}

.option-row:hover {
  background: var(--surface-hover);
}

.option-row:active {
  background: var(--surface-active);
}

.option-label {
  color: var(--text);
}

.option-value {
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  padding: 4px 12px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
}

.option-value.active {
  color: var(--accent);
  background: rgba(255, 34, 85, 0.08);
}

.folder-path {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.options-footer {
  padding: 12px 24px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.quit-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 16px 20px;
  background: transparent;
  border: 1px solid rgba(255, 68, 102, 0.2);
  border-radius: var(--radius-sm);
  color: rgba(255, 68, 102, 0.8);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-size: var(--font-base);
}

.quit-btn:hover {
  background: rgba(255, 68, 102, 0.08);
  border-color: var(--danger);
  color: var(--danger);
}

.quit-btn svg {
  width: 22px;
  height: 22px;
}
</style>
