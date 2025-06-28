<template>
  <div class="flex h-full w-64 flex-col border-r border-gray-200 shrink-0">
    <!-- Team name -->
    <div class="flex h-16 items-center border-b border-gray-200 px-6">
      <h1 class="text-xl font-bold">Framesend</h1>
    </div>

    <!-- Search -->
    <div class="p-4">
      <div class="relative">
        <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input v-model="searchQuery" placeholder="Search..." class="pl-9" @update:modelValue="handleSearch" />
      </div>
    </div>

    <!-- Projects List -->
    <div class="flex-1 overflow-y-auto px-3">
      <div class="mb-2 px-3 text-[11px] text-gray-400">Projects</div>
      <nav class="space-y-1">
        <button v-for="project in projects" :key="project.id" :class="[
          'flex w-full items-center justify-between rounded-smooth-lg px-3 py-2 text-sm transition-colors',
          activeProjectId === project.id
            ? 'bg-gray-200/70 text-gray-700'
            : 'text-gray-700 hover:bg-gray-100'
        ]" @click="setActiveProject(project.id)">
          <div class="flex items-center gap-3">
            <!-- <div class="text-lg">{{ project.icon }}</div> -->
            <div class="font-regular whitespace-nowrap overflow-hidden text-ellipsis flex-1">{{ project.name }}</div>
          </div>
          <Badge variant="default" class="ml-2">
            {{ project.videoCount }}
          </Badge>
        </button>
      </nav>
    </div>

    <!-- Bottom Actions -->
    <div class="border-t border-gray-200 p-4">
      <Button variant="secondary" class="w-full" size="sm">
        <Icon name="plus" size="sm" class="mr-2" />
        New Project
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useProjectsStore } from '../../stores/projects'
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import Button from '../base/Button.vue'
import Input from '../base/Input.vue'
import Icon from '../base/Icon.vue'
import Badge from '../base/Badge.vue'

const projectsStore = useProjectsStore()
const uiStore = useUIStore()

const { projects, activeProjectId } = storeToRefs(projectsStore)
const { setActiveProject } = projectsStore
const { searchQuery } = storeToRefs(uiStore)

const handleSearch = (value) => {
  uiStore.setSearchQuery(value)
}
</script>
