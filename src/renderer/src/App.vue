<template>
  <MainLayout>
    <!-- Dynamic View Based on UI State -->
    <component :is="currentView" />
  </MainLayout>
</template>

<script setup>
  import { computed } from 'vue'
  import { useUIStore } from './stores/ui'
  import { storeToRefs } from 'pinia'
  import MainLayout from './components/layout/MainLayout.vue'
  import KanbanBoard from './components/kanban/KanbanBoard.vue'
  import TableView from './components/table/TableView.vue'

  const uiStore = useUIStore()
  const { viewMode } = storeToRefs(uiStore)

  const currentView = computed(() => {
    return viewMode.value === 'kanban' ? KanbanBoard : TableView
  })
</script>
