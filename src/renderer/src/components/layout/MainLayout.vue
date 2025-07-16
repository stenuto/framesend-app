<template>
  <div
    class="app-container flex-col flex h-screen w-screen overflow-hidden select-none dark:text-zinc-300/90 text-zinc-700">
    <!-- Main Content -->
    <div class="flex-1 flex h-0">
      <Sidebar v-if="sidebarOpen" />
      <div class="flex-1 flex flex-col max-h-full">
        <div class="flex-1 min-h-0">
          <slot />
        </div>
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