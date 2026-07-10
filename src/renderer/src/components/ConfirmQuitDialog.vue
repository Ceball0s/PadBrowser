<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

defineProps<{
  count: number
}>()

const emit = defineEmits<{
  close: []
}>()

const confirmBtn = ref<HTMLButtonElement>()

function onConfirm(): void {
  window.nova?.quitConfirmed?.()
  emit('close')
}

function onCancel(): void {
  window.nova?.quitCancelled?.()
  emit('close')
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    onCancel()
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    onConfirm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  confirmBtn.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="quit-dialog-backdrop">
    <div class="quit-dialog">
      <svg class="quit-dialog-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" stroke="#ff6a00" stroke-width="3"/>
        <text x="32" y="40" text-anchor="middle" fill="#ff6a00" font-size="32" font-weight="bold">!</text>
      </svg>
      <p class="quit-dialog-msg">
        {{ t('confirmQuit.message', { count }) }}
      </p>
      <p class="quit-dialog-detail">{{ t('confirmQuit.question') }}</p>
      <div class="quit-dialog-actions">
        <button ref="confirmBtn" class="qd-btn qd-btn-danger" tabindex="0" @click="onConfirm">
          {{ t('confirmQuit.confirm') }}
        </button>
        <button class="qd-btn qd-btn-secondary" tabindex="0" @click="onCancel">
          {{ t('confirmQuit.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quit-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.quit-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 48px;
  background: #1d163a;
  border: 1px solid #2a2440;
  border-radius: 16px;
  max-width: 480px;
  width: 90%;
}

.quit-dialog-icon {
  width: 64px;
  height: 64px;
}

.quit-dialog-msg {
  font-size: 24px;
  color: #f0eef5;
  text-align: center;
}

.quit-dialog-detail {
  font-size: 18px;
  color: #b0aac8;
  text-align: center;
}

.quit-dialog-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.qd-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: background 0.15s, box-shadow 0.15s;
}

.qd-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 34, 85, 0.7), 0 0 14px rgba(255, 34, 85, 0.3);
}

.qd-btn-danger {
  background: #ff2040;
  color: #fff;
}
.qd-btn-danger:hover {
  background: #d91a36;
}

.qd-btn-secondary {
  background: #2a2440;
  color: #b0aac8;
}
.qd-btn-secondary:hover {
  background: #352d5a;
  color: #f0eef5;
}
</style>
