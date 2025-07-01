<template>
  <nav
    class="drag h-9 flex items-center border-b border-zinc-700 bg-zinc-900/30 w-full shrink-0 pl-24 pr-3 items-center">
    <!-- Navigation Controls -->
    <div class="flex items-center gap-1 mr-4">
      <Button variant="ghost" iconName="arrow-left" class="disabled:opacity-50 disabled:cursor-not-allowed"
        title="Go back" :disabled="!canGoBack" @click="router.goBack" />
      <Button variant="ghost" iconName="arrow-right" class="disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!canGoForward" title="Go forward" @click="router.goForward" />
    </div>

    <!-- Page Navigation -->
    <div class="flex items-center gap-1">
      <Button variant="ghost" iconName="home" :class="[

        currentPage === 'dashboard' && 'bg-zinc-800'
      ]" title="Dashboard" @click="router.navigate('dashboard')" />
      <Button variant="ghost" iconName="folder" :class="[

        currentPage === 'projects' && 'bg-zinc-800'
      ]" title="Projects" @click="router.navigate('projects')" />
    </div>

    <div class="flex-1 flex items-center justify-center" />
    <div class="flex items-center gap-0.5">
      <Button variant="ghost" iconName="chart-no-axes-combined" class="" />
      <Button variant="ghost" iconName="cloud" class="" />
      <Button variant="ghost" iconName="settings" :class="[

        currentPage === 'settings' && 'bg-zinc-800'
      ]" title="Settings" @click="router.navigate('settings')" />
    </div>
  </nav>
</template>

<script setup>
import Button from '../base/Button.vue'
import { useRouterStore } from '../../stores/router'
import { storeToRefs } from 'pinia'

const router = useRouterStore()
const { canGoBack, canGoForward, currentPage } = storeToRefs(router)
</script>