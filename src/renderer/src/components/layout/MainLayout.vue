<template>
  <div class="app-container flex-col flex h-screen w-screen overflow-hidden bg-zinc-900/75">
    <!-- Main Content -->
    <div class="flex-1 flex h-0">
      <Sidebar v-if="sidebarOpen" />
      <div class="flex-1 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'

const uiStore = useUIStore()
const { sidebarOpen } = storeToRefs(uiStore)
</script>