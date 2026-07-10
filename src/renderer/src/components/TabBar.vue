<script setup lang="ts">
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

interface Tab {
  id: string
  title: string
  url: string
  active: boolean
  isLoading: boolean
}

defineProps<{
  tabs: Tab[]
  overlayOpen: boolean
}>()

const emit = defineEmits<{
  switchTab: [id: string]
  closeTab: [id: string]
}>()
</script>

<template>
  <div class="tabs-display traditional-tabs">
    <div class="tabs-scroll">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :data-tab-id="tab.id"
        :class="['tab-item', { active: tab.active && !overlayOpen, loading: tab.isLoading }]"
        @click="emit('switchTab', tab.id)"
      >
        <div class="tab-item-content">
          <span class="tab-item-title">{{ tab.title }}</span>
          <span class="tab-item-url">{{ tab.url || t('tabs.homeTitle') }}</span>
        </div>
        <span class="tab-close" @click.stop="emit('closeTab', tab.id)" :title="t('tabs.closeTab')">✕</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tabs-display {
  flex: 1;
  display: flex;
  align-items: stretch; /* Estira el contenedor al alto total */
  min-height: 100%;
  min-width: 0;
  width: 100%;
}

.tabs-scroll {
  display: flex;
  gap: 0; /* Sin separaciones raras, estilo navegador nativo */
  overflow-x: auto;
  scrollbar-width: none;
  width: 100%;
  min-width: 0;
  padding: 0; /* Cero paddings para ocupar todo el tamaño vertical */
  align-items: stretch;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-item {
  position: relative;
  flex: 1;
  min-width: 120px;
  max-width: 240px;
  padding: 0 16px;
  /* Fondo transparente que hereda el morado de la toolbar */
  background: transparent; 
  /* Separador sutil a la derecha entre pestañas */
  border: none;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0; /* Sin esquinas redondeadas flotantes para que llene el contenedor */
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%; /* Ocupa los 42px de la barra */
  transition: background-color 0.2s, color 0.2s;
}

/* Línea inferior profesional (Mismo diseño premium del buscador) */
.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px; /* Un grosor ideal para que se note en la toolbar */
  background: #e50914; /* Rojo Netflix */
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 2;
}

/* HOVER INTELIGENTE */
.tab-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

/* 1. PESTAÑA ACTIVA - Se ilumina suavemente el fondo y se expande la línea inferior */
.tab-item.active {
  background: rgba(255, 255, 255, 0.07);
  color: #ffffff;
}

.tab-item.active::after {
  width: 100%;
  left: 0;
}

.tab-item.loading::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%);
  animation: tabLoading 1.2s infinite linear;
  z-index: 3;
}

@keyframes tabLoading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 2. PESTAÑA ENFOCADA (D-pad / Controladores) - Animación del pulso dinámico sin lag */
.tab-item:focus {
  outline: none !important;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  z-index: 5;
  animation: tabNetflixPulse 3s infinite alternate ease-in-out;
}

.tab-item:focus::after {
  width: 100%;
  left: 0;
}

/* ANIMACIÓN DE PULSO DE LUZ CONTROLADA */
@keyframes tabNetflixPulse {
  0% {
    box-shadow: inset 0 -8px 12px rgba(229, 9, 20, 0.15);
  }
  100% {
    box-shadow: inset 0 -8px 24px rgba(229, 9, 20, 0.35);
  }
}

/* BOTÓN CERRAR - Más estilizado */
.tab-close {
  display: none;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.15s;
}

.tab-item:hover .tab-close,
.tab-item:focus .tab-close {
  display: flex;
}

.tab-close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* CONTENIDO INTERNO Y TEXTOS CORREGIDOS (Sin letras rojas) */
.tab-item-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  padding-right: 16px;
  height: 100%;
}

.tab-item-title {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-item-url {
  display: none;
}

/* Intercambio limpio de Texto -> URL conservando tipografía elegante y legible */
.tab-item:hover .tab-item-title,
.tab-item:focus .tab-item-title {
  display: none;
}

.tab-item:hover .tab-item-url,
.tab-item:focus .tab-item-url {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85); /* Blanco/Gris suave perfectamente integrado */
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>