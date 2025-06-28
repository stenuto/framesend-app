<template>
  <header class="app-header flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 pl-20 flex-shrink-0" style="-webkit-app-region: drag">
    <div class="flex items-center gap-4">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-500">Projects</span>
        <span class="text-gray-400">/</span>
        <span class="font-medium text-gray-900">{{ activeProject?.name }}</span>
      </div>
    </div>

    <div class="flex items-center gap-4" style="-webkit-app-region: no-drag">
      <!-- Filter Button -->
      <Button variant="ghost" size="sm">
        <Icon name="filter" size="sm" class="mr-2" />
        Filter
      </Button>

      <!-- View Switcher -->
      <div class="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button :class="[
          'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
          viewMode === 'kanban'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        ]" @click="setViewMode('kanban')">
          <Icon name="grid" size="sm" />
          Kanban
        </button>
        <button :class="[
          'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
          viewMode === 'table'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        ]" @click="setViewMode('table')">
          <Icon name="list" size="sm" />
          Table
        </button>
      </div>

      <!-- Share Button -->
      <Button size="sm"> Share </Button>
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
