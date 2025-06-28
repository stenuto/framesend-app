<template>
  <div class="app-container flex h-screen w-screen overflow-hidden bg-white/75">
    <!-- Sidebar -->
    <Sidebar v-if="sidebarOpen" />

    <!-- Main Content Area -->
    <div
      class="main-content flex-1 flex flex-col w-0 m-3 rounded-smooth-xl border border-gray-200 bg-white overflow-hidden">
      <!-- Fixed Header -->
      <Header />

      <!-- Scrollable Content -->
      <div class="content-area flex-1 overflow-auto">
        <slot />
      </div>
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
