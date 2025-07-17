import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const searchQuery = ref('')
  const selectedVideo = ref(null)
  const detailPanelWidth = ref(320) // Default width in pixels

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function selectVideo(video) {
    selectedVideo.value = video
  }

  function clearSelectedVideo() {
    selectedVideo.value = null
  }

  function setDetailPanelWidth(width) {
    detailPanelWidth.value = width
  }

  return {
    sidebarOpen,
    searchQuery,
    selectedVideo,
    detailPanelWidth,
    toggleSidebar,
    setSearchQuery,
    selectVideo,
    clearSelectedVideo,
    setDetailPanelWidth
  }
})