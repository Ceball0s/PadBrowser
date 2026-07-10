<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

defineProps<{
  show: boolean
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="loading-overlay">
      <div class="loader-container">
        <div class="ring ring-outer"></div>
        <div class="ring ring-inner"></div>
        <div class="ring ring-center"></div>
        
        <div class="core-glow"></div>
      </div>
      <div class="loading-text">
        {{ t('loading.text') }}<span class="dots">...</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Transición de aparición/desaparición suave */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, backdrop-filter 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* Fondo oscuro translúcido con desenfoque de la página de fondo */
  background: radial-gradient(circle at center, rgba(15, 20, 28, 0.8) 0%, rgba(8, 12, 17, 0.95) 100%);
  backdrop-filter: blur(8px);
}

.loader-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

/* Base de los anillos */
.ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
}

/* Anillo exterior (Azul Steam) */
.ring-outer {
  width: 100%;
  height: 100%;
  border-top-color: #66c0f4;
  border-bottom-color: rgba(102, 192, 244, 0.2);
  animation: spin 2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  box-shadow: 0 0 15px rgba(102, 192, 244, 0.3);
}

/* Anillo interior (Rojo Acento) */
.ring-inner {
  width: 70%;
  height: 70%;
  border-left-color: #e50914;
  border-right-color: rgba(229, 9, 20, 0.2);
  animation: spin-reverse 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  box-shadow: inset 0 0 15px rgba(229, 9, 20, 0.3);
}

/* Anillo central estático (Blanco) */
.ring-center {
  width: 40%;
  height: 40%;
  border-top-color: #ffffff;
  border-bottom-color: #ffffff;
  animation: spin 3s linear infinite;
  opacity: 0.5;
}

/* Núcleo brillante palpitante */
.core-glow {
  width: 12px;
  height: 12px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 20px 5px rgba(102, 192, 244, 0.8);
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #a4b4c4;
  text-shadow: 0 0 10px rgba(164, 180, 196, 0.5);
  display: flex;
  align-items: center;
}

.dots {
  display: inline-block;
  width: 20px;
  text-align: left;
  animation: blink 1.5s infinite steps(4, end);
}

/* Animaciones */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 10px 2px rgba(102, 192, 244, 0.5); }
  50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 30px 8px rgba(229, 9, 20, 0.6); }
}

@keyframes blink {
  0%, 20% { color: transparent; text-shadow: none; }
  40% { color: #a4b4c4; }
}
</style>