<template>
  <div
    class="app-container flex-col flex h-screen w-screen overflow-hidden select-none text-zinc-300/90">
    <!-- Main Content -->
    <div class="flex-1 flex h-0 relative">
      <!-- Sidebar -->
      <Sidebar v-if="sidebarOpen" />

      <div class="flex-1 flex flex-col max-h-full">
        <div class="flex-1 min-h-0">
          <slot />
        </div>
      </div>
      <!-- Video detail panel -->
      <VideoPanel 
        :selected-video="selectedVideo"
        :width="detailPanelWidth"
        @start-resize="startResize"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'
import Button from '@components/base/Button.vue'
import VideoPanel from '@components/VideoPanel.vue'

const uiStore = useUIStore()
const { sidebarOpen, selectedVideo, detailPanelWidth } = storeToRefs(uiStore)

// Resize functionality
const isResizing = ref(false)
const minWidth = ref(0)
const maxWidth = ref(0)

// Calculate min/max widths based on viewport
const updateWidthLimits = () => {
  const vw = window.innerWidth
  minWidth.value = vw * 0.2 // 20vw
  maxWidth.value = vw * 0.5 // 50vw
}

// Mouse handlers for resize
const startResize = (e) => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (e) => {
  if (!isResizing.value) return

  const newWidth = window.innerWidth - e.clientX
  const clampedWidth = Math.max(minWidth.value, Math.min(maxWidth.value, newWidth))
  uiStore.setDetailPanelWidth(clampedWidth)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Update limits on mount and window resize
onMounted(() => {
  updateWidthLimits()
  window.addEventListener('resize', updateWidthLimits)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidthLimits)
})
</script>