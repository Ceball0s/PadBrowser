<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps<{
  getActiveWebview?: () => Electron.WebviewTag | undefined
}>()

const emit = defineEmits<{
  close: []
  submit: []
}>()

const caps = ref(false)

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

const rows = computed(() => {
  return caps.value
    ? ['1234567890', 'QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM']
    : ['1234567890', 'qwertyuiop', 'asdfghjklñ', 'zxcvbnm']
})

function resolveTarget(): { host: HTMLElement | null; webview: Electron.WebviewTag | null } {
  const el = document.activeElement as HTMLElement | null
  const tag = el?.tagName?.toLowerCase() || ''
  if (tag === 'input' || tag === 'textarea') {
    return { host: el, webview: null }
  }
  return { host: null, webview: props.getActiveWebview?.() || null }
}

function dispatchHostKey(target: HTMLElement, key: string, type: 'down' | 'press' | 'up'): void {
  const isBackspace = key === 'Backspace'
  const opts: KeyboardEventInit = {
    key,
    code: isBackspace ? 'Backspace' : 'Key' + key.toUpperCase(),
    bubbles: true,
    cancelable: true,
    keyCode: isBackspace ? 8 : key.charCodeAt(0),
    charCode: type === 'press' && !isBackspace ? key.charCodeAt(0) : 0
  }
  const eventType = type === 'down' ? 'keydown' : type === 'press' ? 'keypress' : 'keyup'
  target.dispatchEvent(new KeyboardEvent(eventType, opts))
}

function insertIntoHost(target: HTMLElement, text: string): void {
  dispatchHostKey(target, text, 'down')
  dispatchHostKey(target, text, 'press')
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? target.value.length
    const end = target.selectionEnd ?? start
    target.value = target.value.slice(0, start) + text + target.value.slice(end)
    target.selectionStart = target.selectionEnd = start + text.length
    target.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  } else if (target.isContentEditable) {
    document.execCommand('insertText', false, text)
  }
  dispatchHostKey(target, text, 'up')
}

function deleteFromHost(target: HTMLElement): void {
  dispatchHostKey(target, 'Backspace', 'down')
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? target.value.length
    const end = target.selectionEnd ?? start
    if (start === 0 && end === 0) { dispatchHostKey(target, 'Backspace', 'up'); return }
    if (start === end) {
      target.value = target.value.slice(0, start - 1) + target.value.slice(end)
      target.selectionStart = target.selectionEnd = Math.max(0, start - 1)
    } else {
      target.value = target.value.slice(0, start) + target.value.slice(end)
      target.selectionStart = target.selectionEnd = start
    }
    target.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  } else if (target.isContentEditable) {
    document.execCommand('delete')
  }
  dispatchHostKey(target, 'Backspace', 'up')
}

function insertIntoWebview(wv: Electron.WebviewTag, text: string): void {
  const js = JSON.stringify(text)
  const code = `
    (function() {
      try {
        var el = document.activeElement;
        if (!el || !el.tagName) return;
        var tag = el.tagName.toLowerCase();
        var isBackspace = ${JSON.stringify(text)} === 'Backspace';
        function fire(type, opts) {
          el.dispatchEvent(new KeyboardEvent(type, opts));
        }
        if (tag === 'input' || tag === 'textarea') {
          fire('keydown', { key: ${js}, code: 'Key' + ${js}.toUpperCase(), bubbles: true, cancelable: true, keyCode: ${js}.charCodeAt(0) });
          fire('keypress', { key: ${js}, code: 'Key' + ${js}.toUpperCase(), bubbles: true, cancelable: true, keyCode: ${js}.charCodeAt(0), charCode: ${js}.charCodeAt(0) });
          var start = el.selectionStart != null ? el.selectionStart : el.value.length;
          var end = el.selectionEnd != null ? el.selectionEnd : start;
          el.value = el.value.slice(0, start) + ${js} + el.value.slice(end);
          el.selectionStart = el.selectionEnd = start + ${js}.length;
          el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          fire('keyup', { key: ${js}, code: 'Key' + ${js}.toUpperCase(), bubbles: true, cancelable: true, keyCode: ${js}.charCodeAt(0) });
        } else if (el.isContentEditable) {
          fire('keydown', { key: ${js}, code: 'Key' + ${js}.toUpperCase(), bubbles: true, cancelable: true, keyCode: ${js}.charCodeAt(0) });
          document.execCommand('insertText', false, ${js});
          fire('keyup', { key: ${js}, code: 'Key' + ${js}.toUpperCase(), bubbles: true, cancelable: true, keyCode: ${js}.charCodeAt(0) });
        }
      } catch(e) {}
    })()
  `
  wv.executeJavaScript(code).catch(() => {})
}

function deleteFromWebview(wv: Electron.WebviewTag): void {
  const code = `
    (function() {
      try {
        var el = document.activeElement;
        if (!el || !el.tagName) return;
        var tag = el.tagName.toLowerCase();
        function fire(type, opts) {
          el.dispatchEvent(new KeyboardEvent(type, opts));
        }
        if (tag === 'input' || tag === 'textarea') {
          fire('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, keyCode: 8 });
          var start = el.selectionStart != null ? el.selectionStart : el.value.length;
          var end = el.selectionEnd != null ? el.selectionEnd : start;
          if (start === 0 && end === 0) { fire('keyup', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, keyCode: 8 }); return; }
          if (start === end) {
            el.value = el.value.slice(0, start - 1) + el.value.slice(end);
            el.selectionStart = el.selectionEnd = Math.max(0, start - 1);
          } else {
            el.value = el.value.slice(0, start) + el.value.slice(end);
            el.selectionStart = el.selectionEnd = start;
          }
          el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          fire('keyup', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, keyCode: 8 });
        } else if (el.isContentEditable) {
          fire('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, keyCode: 8 });
          document.execCommand('delete');
          fire('keyup', { key: 'Backspace', code: 'Backspace', bubbles: true, cancelable: true, keyCode: 8 });
        }
      } catch(e) {}
    })()
  `
  wv.executeJavaScript(code).catch(() => {})
}

function pressKey(ch: string): void {
  const t = resolveTarget()
  if (t.host) {
    insertIntoHost(t.host, ch)
  } else if (t.webview) {
    insertIntoWebview(t.webview, ch)
  }
}

function backspace(): void {
  const t = resolveTarget()
  if (t.host) {
    deleteFromHost(t.host)
  } else if (t.webview) {
    deleteFromWebview(t.webview)
  }
}

function space(): void {
  const t = resolveTarget()
  if (t.host) {
    insertIntoHost(t.host, ' ')
  } else if (t.webview) {
    insertIntoWebview(t.webview, ' ')
  }
}

function toggleCaps(): void {
  caps.value = !caps.value
}

function sendEnterToHost(target: HTMLElement): void {
  const opts: KeyboardEventInit = {
    key: 'Enter',
    code: 'Enter',
    bubbles: true,
    cancelable: true,
    keyCode: 13
  }
  target.dispatchEvent(new KeyboardEvent('keydown', opts))
  target.dispatchEvent(new KeyboardEvent('keypress', opts))
  target.dispatchEvent(new KeyboardEvent('keyup', opts))
}

function sendEnterToWebview(wv: Electron.WebviewTag): void {
  const code = `
    (function() {
      try {
        var el = document.activeElement;
        if (!el || !el.tagName) return;
        var opts = { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true, keyCode: 13 };
        el.dispatchEvent(new KeyboardEvent('keydown', opts));
        el.dispatchEvent(new KeyboardEvent('keypress', opts));
        el.dispatchEvent(new KeyboardEvent('keyup', opts));
        if (el.form && el.tagName === 'INPUT') {
          el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      } catch(e) {}
    })()
  `
  wv.executeJavaScript(code).catch(() => {})
}

function handleEnter(): void {
  const t = resolveTarget()
  if (t.host) {
    sendEnterToHost(t.host)
  } else if (t.webview) {
    sendEnterToWebview(t.webview)
  }
  emit('submit')
  emit('close')
}
</script>

<template>
  <div class="keyboard-overlay" @mousedown.prevent>
    <div class="keyboard-panel">
      <div class="keyboard-keys">
        <div
          v-for="(row, ri) in rows"
          :key="ri"
          class="keyboard-row"
          :class="'row-offset-' + ri"
        >
          <button
            v-for="ch in row.split('')"
            :key="ch"
            class="key-btn"
            @mousedown.prevent
            @click="pressKey(ch)"
          >
            {{ ch }}
          </button>
          <button
            v-if="ri === 0"
            class="key-btn key-bksp"
            @mousedown.prevent
            @click="backspace"
            :title="t('keyboard.backspace')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>

        <div class="keyboard-row action-row">
          <button class="key-btn key-close" @mousedown.prevent @click="emit('close')" :title="t('keyboard.close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button class="key-btn key-shift" :class="{ active: caps }" @mousedown.prevent @click="toggleCaps" :title="t('keyboard.capslock')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="12 17 12 9" />
              <polyline points="9 12 12 9 15 12" />
              <path d="M5 21h14" />
            </svg>
          </button>
          <button class="key-btn key-space" @mousedown.prevent @click="space" :title="t('keyboard.space')" />
          <button class="key-btn key-enter" @mousedown.prevent @click="handleEnter">{{ t('keyboard.enter') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.keyboard-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 200;
}

.keyboard-panel {
  width: 100%;
  max-width: 820px;
  max-height: 55vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px 24px;
  outline: none;
  background: var(--bg);
  border-radius: var(--radius) var(--radius) 0 0;
}

.keyboard-keys {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.keyboard-row {
  display: flex;
  gap: 6px;
  justify-content: center;
  width: 100%;
}

.row-offset-1 {
  padding-left: 24px;
}

.row-offset-2 {
  padding-left: 48px;
}

.row-offset-3 {
  padding-left: 24px;
}

.action-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.key-close {
  min-width: 56px;
  margin-right: auto;
}

.key-enter {
  min-width: 80px;
  margin-left: auto;
  background: rgba(255, 34, 85, 0.15);
  border-color: var(--accent-dim);
  color: var(--accent);
  font-size: var(--font-base);
  font-weight: 600;
}

.key-enter:hover {
  background: rgba(255, 34, 85, 0.25);
  border-color: var(--accent);
}

.key-btn {
  min-width: 56px;
  height: 56px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;
  user-select: none;
}

.key-btn:hover {
  background: var(--surface-hover);
  border-color: rgba(255, 34, 85, 0.2);
}

.key-btn:active {
  background: var(--surface-active);
  transform: scale(0.95);
}

.key-btn:focus-visible {
  outline: none;
  border-color: var(--accent);
  background: rgba(255, 34, 85, 0.2);
  box-shadow:
    0 0 0 3px rgba(255, 34, 85, 0.7),
    0 0 18px rgba(255, 34, 85, 0.4),
    0 0 40px rgba(255, 34, 85, 0.12);
  transform: scale(1.06);
}

.key-btn svg {
  width: 22px;
  height: 22px;
}

.key-shift {
  min-width: 72px;
}

.key-shift.active {
  background: rgba(255, 34, 85, 0.12);
  border-color: var(--accent-dim);
  color: var(--accent);
}

.key-bksp {
  min-width: 56px;
}

.key-space {
  flex: 1;
  max-width: 320px;
  min-width: 120px;
}
</style>
