<template>
  <header class="app-header flex h-9 items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-3 flex-shrink-0">
    <div class="flex items-center gap-4">
      <!-- App Title -->
      <div class="flex items-center gap-2 text-sm">
        <span class="font-medium text-zinc-900 dark:text-zinc-100">File Explorer</span>
      </div>
    </div>

    <div class="flex items-center gap-4" style="-webkit-app-region: no-drag">

    </div>
  </header>
</template>

<script setup>
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'

const uiStore = useUIStore()

const { viewMode } = storeToRefs(uiStore)
const { setViewMode } = uiStore
</script>
