import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const searchQuery = ref('')

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  return {
    sidebarOpen,
    searchQuery,
    toggleSidebar,
    setSearchQuery
  }
})