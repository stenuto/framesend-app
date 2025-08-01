<template>
<div class="app-container flex-col flex h-screen w-screen overflow-hidden select-none text-zinc-300/90 bg-zinc-850">
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
    <VideoPanel :selected-video="selectedVideo" />
  </div>
</div>
</template>

<script setup>
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'
import VideoPanel from '@components/VideoPanel.vue'

const uiStore = useUIStore()
const { sidebarOpen, selectedVideo } = storeToRefs(uiStore)
</script>