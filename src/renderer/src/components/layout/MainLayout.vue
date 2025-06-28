<template>
  <div class="app-container flex-col flex h-screen w-screen overflow-hidden bg-white/75">

    <!-- Nav -->
    <Nav />
    <!-- Main Content -->
    <div class="flex-1 flex h-0">
      <Sidebar v-if="sidebarOpen" />
      <div class="flex-1 flex flex-col w-0 m-1.5 rounded-smooth-lg border border-gray-200 overflow-hidden">
        <Header class="bg-white border-b border-gray-200" />
        <div class="content-area flex-1 overflow-auto bg-white">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import Nav from './Nav.vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const uiStore = useUIStore()
const { sidebarOpen } = storeToRefs(uiStore)
</script>
