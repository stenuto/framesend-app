<template>
  <div class="file-explorer h-full overflow-y-auto" @dragover="handleRootDragOver" @drop="handleRootDrop"
    @dragleave="handleRootDragLeave">
    <div v-for="item in items" :key="item.id" @click="handleItemClick(item)">
      <FileExplorerItem :item="item" :depth="0" :expanded-folders="expandedFolders" :selected-item-id="selectedItemId"
        :config="config" @toggle-folder="toggleFolder" @select-video="selectVideo" @select-folder="selectFolder"
        @drag-start="handleDragStart" @drag-end="handleDragEnd" @drop-item="handleDropItem" />
    </div>
    <!-- Drop zone indicator for root level -->
    <div v-if="showRootDropZone"
      class="root-drop-zone border-2 border-dashed border-blue-500 bg-blue-500/10 mx-2 my-1 p-4 rounded text-center text-sm text-blue-600 dark:text-blue-400">
      Drop here to move to root level
    </div>
  </div>
</template>

<script>
import { useFileExplorerStore } from '../stores/fileExplorer'
import FileExplorerItem from './FileExplorerItem.vue'

export default {
  name: 'FileExplorer',
  components: {
    FileExplorerItem
  },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({
        indentSize: 12, // pixels per depth level
        itemPaddingY: 'py-[2.5px]', // tailwind class for vertical padding
        itemPaddingX: 'px-1', // tailwind class for horizontal padding
        fontSize: 'text-[13px]', // tailwind class for font size
        chevronSize: 'size-4', // tailwind class for chevron size
        videoIconSize: 'size-3', // tailwind class for video icon size
        guideLineOffset: 15, // pixels from left edge of indentation
        initialFolderOffset: 8, // initial padding for root folders
        videoIndentExtra: 6, // extra indent for video items
        showVideoCount: false,
        showVideoDuration: false
      })
    }
  },
  emits: ['select-video', 'select-folder'],

  setup() {
    const fileExplorerStore = useFileExplorerStore()
    return {
      fileExplorerStore
    }
  },

  data() {
    return {
      draggedItem: null,
      showRootDropZone: false,
      rootDragOverTimer: null
    }
  },
  computed: {
    expandedFolders() {
      return this.fileExplorerStore.uiState.expandedFolders
    },
    selectedItemId() {
      return this.fileExplorerStore.uiState.selectedItemId
    }
  },
  beforeUnmount() {
    this.clearRootDragTimer()
  },
  methods: {
    toggleFolder(folderId) {
      this.fileExplorerStore.toggleFolder(folderId)
    },
    selectVideo(video) {
      this.fileExplorerStore.setSelectedItem(video.id, 'file')
      this.$emit('select-video', video)
    },
    selectFolder(folder) {
      this.fileExplorerStore.setSelectedItem(folder.id, 'folder')
      this.$emit('select-folder', folder)
    },
    handleItemClick(item) {
      if (item.type === 'folder') {
        this.toggleFolder(item.id)
        this.selectFolder(item)
      } else {
        this.selectVideo(item)
      }
    },
    handleDragStart(dragData) {
      this.draggedItem = dragData
      // Store in a way that child components can access during dragover
      window.__draggedItem = dragData
    },
    handleDragEnd() {
      // Clean up all drag state
      this.draggedItem = null
      this.showRootDropZone = false
      this.clearRootDragTimer()
      window.__draggedItem = null

      // Force immediate update
      this.$nextTick(() => {
        this.showRootDropZone = false
      })
    },
    handleDropItem({ draggedItem, targetItem, position }) {
      if (!draggedItem || !targetItem) return

      // Handle different drop scenarios
      if (draggedItem.type === 'video') {
        this.handleVideoMove(draggedItem, targetItem, position)
      } else if (draggedItem.type === 'folder') {
        this.handleFolderMove(draggedItem, targetItem, position)
      }
    },
    handleVideoMove(draggedItem, targetItem, position) {
      const video = draggedItem.item

      if (targetItem.type === 'folder' && position === 'inside') {
        // Move video into a folder
        this.fileExplorerStore.moveFile(video.id, targetItem.id)

        // Expand the target folder to show the dropped item
        this.fileExplorerStore.expandFolder(targetItem.id)
      } else {
        // Move video before/after another item
        const targetFolderId = targetItem.type === 'video' ? targetItem.folderId : targetItem.id
        const targetFiles = this.fileExplorerStore.getFilesByFolder(targetFolderId)

        let newIndex = 0
        if (targetItem.type === 'video') {
          const targetIndex = targetFiles.findIndex(f => f.id === targetItem.id)
          newIndex = position === 'before' ? targetIndex : targetIndex + 1
        } else if (position === 'after') {
          // After a folder means at the beginning of the next level
          newIndex = 0
        }

        this.fileExplorerStore.moveFile(video.id, targetFolderId, newIndex)
      }
    },
    handleFolderMove(draggedItem, targetItem, position) {
      const folder = draggedItem.item

      // Find the folder in the folders list
      const folderData = this.fileExplorerStore.getFolderById(folder.id)
      if (!folderData) return

      // Default to 'inside' for folder-to-folder drops when position is null
      const dropPosition = position || (targetItem.type === 'folder' ? 'inside' : 'after')

      if (targetItem.type === 'folder' && dropPosition === 'inside') {
        // Move folder into another folder - parentId should be the target folder's ID
        this.fileExplorerStore.moveFolder(folder.id, targetItem.id)

        // Expand the target folder to show the dropped item
        this.fileExplorerStore.expandFolder(targetItem.id)
      } else {
        // Move folder before/after another item
        if (targetItem.type === 'folder') {
          const targetFolder = this.fileExplorerStore.getFolderById(targetItem.id)
          if (targetFolder) {
            // Calculate new index
            const siblingFolders = this.fileExplorerStore.getFoldersByParent(targetFolder.parentId)

            const targetIndex = siblingFolders.findIndex(f => f.id === targetItem.id)
            const newIndex = position === 'before' ? targetIndex : targetIndex + 1

            this.fileExplorerStore.moveFolder(folder.id, targetFolder.parentId, newIndex)
          }
        }
      }
    },
    handleRootDragOver(event) {
      // Only handle if we're dragging over the empty space
      if (event.target === event.currentTarget || event.target.classList.contains('root-drop-zone')) {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'

        if (!this.showRootDropZone && this.draggedItem) {
          this.rootDragOverTimer = setTimeout(() => {
            this.showRootDropZone = true
          }, 300)
        }
      }
    },
    handleRootDrop(event) {
      // Only handle if we're dropping on the empty space
      if (event.target === event.currentTarget || event.target.classList.contains('root-drop-zone')) {
        event.preventDefault()
        event.stopPropagation()

        const dragData = window.__draggedItem
        if (!dragData) {
          this.showRootDropZone = false
          this.clearRootDragTimer()
          return
        }

        // Move items to root level
        if (dragData.type === 'video') {
          // Move file to root (folderId = null)
          this.fileExplorerStore.moveFile(dragData.item.id, null)
        } else if (dragData.type === 'folder') {
          // Move folder to root (parentId = null)
          this.fileExplorerStore.moveFolder(dragData.item.id, null)
        }

        // Ensure drop zone is hidden immediately after drop
        this.showRootDropZone = false
        this.clearRootDragTimer()

        // Force update to ensure UI reflects the change
        this.$nextTick(() => {
          this.showRootDropZone = false
        })
      }
    },
    handleRootDragLeave(event) {
      if (event.target === event.currentTarget) {
        this.clearRootDragTimer()
        this.showRootDropZone = false
      }
    },
    getDragData(event) {
      try {
        const data = event.dataTransfer.getData('application/json')
        return data ? JSON.parse(data) : null
      } catch {
        return null
      }
    },
    clearRootDragTimer() {
      if (this.rootDragOverTimer) {
        clearTimeout(this.rootDragOverTimer)
        this.rootDragOverTimer = null
      }
    }
  }
}
</script>

<style scoped>
/* Smooth transitions for drop zone */
.root-drop-zone {
  transition: all 0.3s ease;
}

/* Ensure proper scrolling behavior during drag */
.file-explorer {
  position: relative;
}
</style>