import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const searchQuery = ref('')
  const selectedVideo = ref(null)
  const selectedItem = ref(null) // For folder/video selection (not panel opening)
  const detailPanelWidth = ref(320) // Default width in pixels

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function selectVideo(video) {
    selectedVideo.value = video
    selectedItem.value = video // Also set as selected item
  }

  function clearSelectedVideo() {
    selectedVideo.value = null
  }

  function selectItem(item) {
    selectedItem.value = item
    // If it's a video, also open the panel
    if (item && item.type === 'video') {
      selectedVideo.value = item
    }
  }

  function clearSelectedItem() {
    selectedItem.value = null
  }

  function setDetailPanelWidth(width) {
    detailPanelWidth.value = width
  }

  return {
    sidebarOpen,
    searchQuery,
    selectedVideo,
    selectedItem,
    detailPanelWidth,
    toggleSidebar,
    setSearchQuery,
    selectVideo,
    clearSelectedVideo,
    selectItem,
    clearSelectedItem,
    setDetailPanelWidth
  }
})