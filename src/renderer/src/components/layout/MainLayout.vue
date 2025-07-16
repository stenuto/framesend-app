<template>
  <div
    class="app-container flex-col flex h-screen w-screen overflow-hidden select-none dark:text-zinc-300/90 text-zinc-700">
    <!-- Main Content -->
    <div class="flex-1 flex h-0 relative">
      <!-- Sidebar -->
      <Sidebar v-if="sidebarOpen" />
      
      <div class="flex-1 flex flex-col max-h-full">
        <div class="flex-1 min-h-0">
          <slot />
        </div>
      </div>
      <div class="w-80 shrink-0 h-full dark:bg-zinc-900 bg-white border-l dark:border-white/10 border-zinc-200">
        <div class="flex items-center justify-center h-full">
          <div class="text-2xl font-bold">
            Hello
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'
import Button from '@components/base/Button.vue'

const uiStore = useUIStore()
const { sidebarOpen } = storeToRefs(uiStore)
</script>