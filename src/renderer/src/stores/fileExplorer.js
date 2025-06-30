import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFileExplorerStore = defineStore('fileExplorer', () => {
  // Set of expanded folder IDs
  const expandedFolders = ref(new Set(['proj1', 'proj2']))
  
  // Currently selected item ID
  const selectedItemId = ref(null)
  
  function toggleFolder(folderId) {
    const folders = new Set(expandedFolders.value)
    if (folders.has(folderId)) {
      folders.delete(folderId)
    } else {
      folders.add(folderId)
    }
    expandedFolders.value = folders
  }
  
  function expandFolder(folderId) {
    const folders = new Set(expandedFolders.value)
    folders.add(folderId)
    expandedFolders.value = folders
  }
  
  function collapseFolder(folderId) {
    const folders = new Set(expandedFolders.value)
    folders.delete(folderId)
    expandedFolders.value = folders
  }
  
  function setSelectedItem(itemId) {
    selectedItemId.value = itemId
  }
  
  function clearSelection() {
    selectedItemId.value = null
  }
  
  function isExpanded(folderId) {
    return expandedFolders.value.has(folderId)
  }
  
  return {
    expandedFolders,
    selectedItemId,
    toggleFolder,
    expandFolder,
    collapseFolder,
    setSelectedItem,
    clearSelection,
    isExpanded
  }
})