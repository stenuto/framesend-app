<template>
  <header class="app-header flex h-9 items-center justify-between border-b border-zinc-200 dark:border-zinc-700 px-3 flex-shrink-0">
    <div class="flex items-center gap-4">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-zinc-500 dark:text-zinc-400">Projects</span>
        <span class="text-zinc-400 dark:text-zinc-500">/</span>
        <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ activeProject?.name }}</span>
      </div>
    </div>

    <div class="flex items-center gap-4" style="-webkit-app-region: no-drag">

    </div>
  </header>
</template>

<script setup>
import { useProjectsStore } from '../../stores/projects'
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'

const projectsStore = useProjectsStore()
const uiStore = useUIStore()

const { activeProject } = storeToRefs(projectsStore)
const { viewMode } = storeToRefs(uiStore)
const { setViewMode } = uiStore
</script>
