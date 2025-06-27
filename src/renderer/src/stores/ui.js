import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const viewMode = ref('kanban') // 'kanban' or 'table'
  const sidebarOpen = ref(true)
  const searchQuery = ref('')
  const activeFilters = ref({
    assignees: [],
    labels: []
  })
  const draggedCardHeight = ref(200) // Height of currently dragged card
  const draggedCard = ref(null)
  const draggedCardOriginalPosition = ref(null)

  function setViewMode(mode) {
    if (['kanban', 'table'].includes(mode)) {
      viewMode.value = mode
    }
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function toggleFilter(type, value) {
    const filters = activeFilters.value[type]
    const index = filters.indexOf(value)
    
    if (index === -1) {
      filters.push(value)
    } else {
      filters.splice(index, 1)
    }
  }

  function clearFilters() {
    activeFilters.value = {
      assignees: [],
      labels: []
    }
    searchQuery.value = ''
  }

  function setDraggedCardHeight(height) {
    draggedCardHeight.value = height
  }

  function startDragging(card, listId, index) {
    draggedCard.value = card
    draggedCardOriginalPosition.value = { listId, index }
  }

  function clearDragging() {
    draggedCard.value = null
    draggedCardOriginalPosition.value = null
  }

  return {
    viewMode,
    sidebarOpen,
    searchQuery,
    activeFilters,
    draggedCardHeight,
    draggedCard,
    draggedCardOriginalPosition,
    setViewMode,
    toggleSidebar,
    setSearchQuery,
    toggleFilter,
    clearFilters,
    setDraggedCardHeight,
    startDragging,
    clearDragging
  }
})