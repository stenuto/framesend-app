<template>
  <nav
    class="drag h-9 flex items-center border-b border-zinc-700 bg-zinc-900/30 w-full shrink-0 pl-20 pr-3 items-center">
    <!-- Sidebar Toggle -->
    <div class="mr-2">
      <Button variant="ghost" size="sm" icon-name="menu" title="Toggle sidebar" class="h-7 w-7" @click="toggleSidebar" />
    </div>

    <!-- Navigation Controls -->
    <div class="flex items-center gap-1 mr-4">
      <Button variant="ghost" icon-name="arrow-left" class="disabled:opacity-50 disabled:cursor-not-allowed"
        title="Go back" :disabled="!canGoBack" @click="handleGoBack" />
      <Button variant="ghost" icon-name="arrow-right" class="disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canGoForward" title="Go forward" @click="handleGoForward" />
    </div>

    <!-- Page Navigation -->
    <div class="flex items-center gap-1">
      <Button variant="ghost" icon-name="upload" :class="[
        currentPage === 'upload' && 'bg-zinc-800'
      ]" title="Upload" @click="router.navigateTo('upload')" />
      <Button variant="ghost" icon-name="folder" :class="[
        currentPage === 'projects' && 'bg-zinc-800'
      ]" title="Projects" @click="router.navigateTo('projects')" />
    </div>

    <div class="flex-1 flex items-center justify-center" />
    <div class="flex items-center gap-0.5">
      <Button variant="ghost" icon-name="chart-no-axes-combined" class="" />
      <Button variant="ghost" icon-name="cloud" class="" />
      <Button variant="ghost" icon-name="settings" :class="[
        currentPage === 'settings' && 'bg-zinc-800'
      ]" title="Settings" @click="router.navigateTo('settings')" />
    </div>
  </nav>
</template>

<script setup>
import Button from '@components/base/Button.vue'
import { useRouterStore } from '@/stores/router'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'

const router = useRouterStore()
const uiStore = useUIStore()
const { currentPage } = storeToRefs(router)

// For now, disable back/forward navigation
const canGoBack = false
const canGoForward = false

const handleGoBack = () => {
  // TODO: Implement navigation history
}

const handleGoForward = () => {
  // TODO: Implement navigation history
}

const toggleSidebar = () => {
  uiStore.toggleSidebar()
}
</script>