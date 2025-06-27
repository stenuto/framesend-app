<template>
  <div class="flex h-full gap-4 overflow-x-auto p-6">
    <KanbanColumn v-for="list in lists" :key="list.id" :list="list" />

    <!-- Add List Button -->
    <div class="flex w-80 shrink-0 items-start">
      <Button variant="ghost" class="w-full justify-start">
        <Icon name="plus" size="sm" class="mr-2" />
        Add another list
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProjectsStore } from '../../stores/projects'
import { useVideosStore } from '../../stores/videos'
import { storeToRefs } from 'pinia'
import KanbanColumn from './KanbanColumn.vue'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'

const projectsStore = useProjectsStore()
const videosStore = useVideosStore()

const { activeProjectId } = storeToRefs(projectsStore)

const lists = computed(() => videosStore.listsByProject(activeProjectId.value))
</script>
