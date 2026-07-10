<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'
import { useHistory } from '../composables/useHistory'

const { t } = useI18n()
import type { HistoryEntry } from '../composables/useHistory'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  navigate: [url: string]
  close: []
}>()

const { addEntry, search } = useHistory()

const inputRef = ref<HTMLInputElement | null>(null)
const isUrlInput = computed(() => {
  const val = localValue.value.trim()
  if (!val) return null
  if (val.startsWith('http://') || val.startsWith('https://')) return true
  if (val.includes('.') && !val.includes(' ')) return true
  return false
})
const suggestions = ref<HistoryEntry[]>([])
const selectedIndex = ref(-1)
const localValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

watch(localValue, (val) => {
  if (val.trim()) {
    suggestions.value = search(val)
    selectedIndex.value = -1
  } else {
    suggestions.value = []
  }
})

nextTick(() => {
  inputRef.value?.focus()
  inputRef.value?.select()
})

function getUrl(input: string): string {
  let url = input.trim()
  if (!url) return ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.')) {
      url = 'https://' + url
    } else {
      return ''
    }
  }
  return url
}

function submit(url?: string): void {
  let input = url || localValue.value.trim()
  if (!input) return
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    if (input.includes('.')) {
      input = 'https://' + input
      emit('navigate', input)
      emit('close')
    } else {
      addEntry(input, input, 'search')
      input = 'https://www.google.com/search?q=' + encodeURIComponent(input)
      emit('navigate', input)
      emit('close')
    }
  } else {
    emit('navigate', input)
    emit('close')
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0 && selectedIndex.value < suggestions.value.length) {
      const sel = suggestions.value[selectedIndex.value]
      localValue.value = sel.url
      submit(sel.url)
    } else {
      submit()
    }
  } else if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < suggestions.value.length - 1) {
      selectedIndex.value++
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    }
  }
}

function selectSuggestion(entry: HistoryEntry): void {
  submit(entry.url)
}

function handleBlur(): void {
  setTimeout(() => {
    if (!inputRef.value?.matches(':focus')) {
      emit('close')
    }
  }, 150)
}
</script>

<template>
  <div class="urlbar-container">
    <div class="urlbar-input-wrap">
      <input
        ref="inputRef"
        v-model="localValue"
        type="text"
        class="urlbar-input"
        :placeholder="t('urlbar.placeholder')"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />
      <button class="urlbar-clear" @click="localValue = ''; inputRef?.focus()" v-if="localValue">✕</button>
      <span class="urlbar-icon" :class="{ 'is-url': isUrlInput === true }">
        <svg v-if="isUrlInput === true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M2 8h12M8 2c1.5 1.5 2.5 3.5 2.5 6S9.5 12.5 8 14c-1.5-1.5-2.5-3.5-2.5-6S6.5 3.5 8 2z" />
        </svg>
        <svg v-else viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" />
        </svg>
      </span>
    </div>
    <div v-if="suggestions.length > 0" class="urlbar-suggestions">
      <button
        v-for="(entry, i) in suggestions"
        :key="entry.url"
        :class="['suggestion-item', { selected: i === selectedIndex }]"
        @mousedown.prevent="selectSuggestion(entry)"
      >
        <span class="suggestion-icon">
          <svg v-if="entry.type === 'url'" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="7" cy="7" r="5.5" />
            <path d="M1.5 7h11M7 1.5c1.2 1.2 2 3 2 5.5s-.8 4.3-2 5.5c-1.2-1.2-2-3-2-5.5S5.8 2.7 7 1.5z" />
          </svg>
          <svg v-else viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="6.5" cy="6.5" r="4" />
            <path d="M9 9l3.5 3.5" />
          </svg>
        </span>
        <span class="suggestion-info">
          <span class="suggestion-title">{{ entry.title }}</span>
          <span class="suggestion-url">{{ entry.url }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.urlbar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

.urlbar-input-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-hover);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 8px;
  height: 32px;
  transition: border-color 0.15s;
}

.urlbar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--text-dim);
  opacity: 0.5;
}

.urlbar-icon.is-url {
  opacity: 0.6;
}

.urlbar-icon svg {
  width: 16px;
  height: 16px;
}

.urlbar-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 14px;
  font-family: 'Courier New', monospace;
  min-width: 0;
}

.urlbar-input::placeholder {
  color: var(--text-dim);
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.urlbar-clear {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: var(--text-dim);
  font-size: 11px;
  cursor: pointer;
  flex-shrink: 0;
}

.urlbar-clear:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text);
}

.urlbar-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 8px 8px;
  z-index: 200;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: rgba(255, 34, 85, 0.08);
}

.suggestion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--text-dim);
  opacity: 0.5;
}

.suggestion-icon svg {
  width: 14px;
  height: 14px;
}

.suggestion-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.suggestion-title {
  font-size: 13px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-url {
  font-size: 11px;
  color: var(--text-dim);
  font-family: 'Courier New', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
