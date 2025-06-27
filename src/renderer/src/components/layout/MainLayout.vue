<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <Sidebar v-if="sidebarOpen" />

    <!-- Main Content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Header -->
      <Header />

      <!-- Content Area -->
      <main class="flex-1 overflow-auto bg-gray-50">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const uiStore = useUIStore()
const { sidebarOpen } = storeToRefs(uiStore)
</script>
