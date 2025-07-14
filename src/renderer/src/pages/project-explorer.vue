<template>
  <div class="flex flex-col h-full bg-zinc-900">
    <!-- Project Header with Back Button -->
    <div class="border-b border-zinc-700 px-6 py-4 flex items-center gap-4">
      <Button 
        variant="ghost" 
        icon-name="arrow-left" 
        @click="router.navigateTo('projects')"
        class="h-8 w-8"
      />
      <div>
        <h1 class="text-2xl font-semibold text-zinc-100">{{ selectedProject?.name }}</h1>
        <p class="text-sm text-zinc-400">File Explorer</p>
      </div>
    </div>

    <!-- File Explorer -->
    <div 
      class="flex-1 overflow-y-auto p-6"
      @drop.prevent="handleDropOnRoot($event)"
      @dragover.prevent="handleDragOverRoot($event)"
      @dragleave="handleDragLeaveRoot($event)"
    >
      <div class="space-y-1">
        <!-- Root Items using recursive component -->
        <FileSystemItem
          v-for="item in rootItems"
          :key="item.id"
          :item="item"
          :depth="0"
          :expanded-folders="expandedFolders"
          :drag-over-folder="dragOverFolder"
          :get-folder-items="getFolderItems"
          :get-folder-video-count="getFolderVideoCount"
          @toggle-folder="toggleFolder"
          @drag-start="handleDragStartWrapper"
          @drag-end="handleDragEnd"
          @drop="handleDropWrapper"
          @drag-over="handleDragOverWrapper"
          @drag-leave="handleDragLeaveWrapper"
        />
        
        <!-- Root Drop Zone Indicator (at bottom) -->
        <div 
          v-if="dragOverRoot"
          class="mt-4 p-4 border-2 border-dashed border-cyan-500 bg-cyan-500/10 rounded-lg text-center"
        >
          <span class="text-sm text-cyan-400">Drop here to move to root</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { storeToRefs } from 'pinia'
import Icon from '@components/base/Icon.vue'
import Button from '@components/base/Button.vue'
import FileSystemItem from '@components/FileSystemItem.vue'

export default {
  name: 'ProjectExplorerPage',
  components: {
    Icon,
    Button,
    FileSystemItem
  },
  meta: {
    title: 'Project Explorer'
  },
  setup() {
    const projectsStore = useProjectsStore()
    const router = useRouterStore()
    const { selectedProject } = storeToRefs(projectsStore)
    const { 
      getProjectFileSystem,
      getVideosInFolder,
      getFolderVideoCount,
      moveFileSystemItem,
      debugFileSystem 
    } = projectsStore
    const { fileSystem } = storeToRefs(projectsStore)

    const expandedFolders = ref(new Set())
    const draggedItem = ref(null)
    const dragOverFolder = ref(null)
    const dragOverRoot = ref(false)

    const rootItems = computed(() => {
      return getProjectFileSystem(selectedProject.value?.id)
    })

    const getFolderItems = (folderId) => {
      return fileSystem.value
        .filter(item => item.parentId === folderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(item => {
          // Defensive check - ensure item has a type
          if (!item.type) {
            console.error(`Item ${item.id} (${item.name}) is missing type property!`)
          }
          return item
        })
    }

    const toggleFolder = (folderId) => {
      if (expandedFolders.value.has(folderId)) {
        expandedFolders.value.delete(folderId)
      } else {
        expandedFolders.value.add(folderId)
      }
    }

    // Drag and Drop handlers
    const handleDragStart = (e, item) => {
      // Store the full item reference
      draggedItem.value = { ...item }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', JSON.stringify({
        id: item.id,
        type: item.type,
        name: item.name,
        parentId: item.parentId
      }))
      
      // Add visual feedback
      e.target.style.opacity = '0.5'
    }

    const handleDragEnd = (e) => {
      e.target.style.opacity = ''
      draggedItem.value = null
      dragOverFolder.value = null
      dragOverRoot.value = false
    }

    const handleDragOver = (e, folderId) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      
      // Don't show drop zone on the dragged item itself
      if (!draggedItem.value) return
      
      // Don't allow dropping on itself
      if (draggedItem.value.id === folderId) return
      
      // Don't allow dropping folder into its descendants
      if (draggedItem.value.type === 'folder' && isDescendant(folderId, draggedItem.value.id)) {
        return
      }
      
      dragOverFolder.value = folderId
    }

    const handleDragLeave = (e, folderId) => {
      // Only clear if leaving the folder entirely
      if (!e.currentTarget.contains(e.relatedTarget)) {
        if (dragOverFolder.value === folderId) {
          dragOverFolder.value = null
        }
      }
    }

    const handleDrop = (e, folderId) => {
      e.preventDefault()
      dragOverFolder.value = null
      
      if (!draggedItem.value) return
      
      // Don't allow dropping folder into itself
      if (draggedItem.value.id === folderId) return
      
      // Don't allow dropping folder into its descendants
      if (draggedItem.value.type === 'folder' && isDescendant(folderId, draggedItem.value.id)) {
        console.log('Cannot drop folder into its own descendant')
        return
      }
      
      // Use the store method to move the item
      const success = moveFileSystemItem(draggedItem.value.id, folderId)
      
      if (success) {
        // If moving a folder with contents, expand the destination folder
        if (draggedItem.value.type === 'folder') {
          expandedFolders.value.add(folderId)
        }
        
        console.log(`Moved ${draggedItem.value.name} to folder ${folderId}`)
      }
      
      draggedItem.value = null
    }
    
    // Helper function to check if a folder is a descendant of another
    const isDescendant = (possibleDescendantId, ancestorId) => {
      let current = fileSystem.value.find(i => i.id === possibleDescendantId)
      while (current && current.parentId) {
        if (current.parentId === ancestorId) {
          return true
        }
        current = fileSystem.value.find(i => i.id === current.parentId)
      }
      return false
    }

    // Root level drop handlers
    const handleDragOverRoot = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (!draggedItem.value) return
      
      // Show root drop zone for both videos and folders
      dragOverRoot.value = true
      e.dataTransfer.dropEffect = 'move'
    }
    
    const handleDragLeaveRoot = (e) => {
      // Only clear if we're leaving the entire container
      if (e.currentTarget === e.target) {
        dragOverRoot.value = false
      }
    }
    
    const handleDropOnRoot = (e) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (!draggedItem.value) {
        dragOverRoot.value = false
        return
      }
      
      // Use the store method to move the item to root (parentId = null)
      const success = moveFileSystemItem(draggedItem.value.id, null)
      
      if (success) {
        console.log(`Moved ${draggedItem.value.name} to root`)
      }
      
      dragOverRoot.value = false
      draggedItem.value = null
    }

    // Wrapper methods for recursive component events
    const handleDragStartWrapper = ({ event, item }) => {
      handleDragStart(event, item)
    }
    
    const handleDropWrapper = ({ event, folderId }) => {
      handleDrop(event, folderId)
    }
    
    const handleDragOverWrapper = ({ event, folderId }) => {
      handleDragOver(event, folderId)
    }
    
    const handleDragLeaveWrapper = ({ event, folderId }) => {
      handleDragLeave(event, folderId)
    }

    return {
      router,
      selectedProject,
      rootItems,
      expandedFolders,
      dragOverFolder,
      dragOverRoot,
      toggleFolder,
      getFolderItems,
      getVideosInFolder,
      getFolderVideoCount,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleDragOverRoot,
      handleDragLeaveRoot,
      handleDropOnRoot,
      moveFileSystemItem,
      // Wrapper methods
      handleDragStartWrapper,
      handleDropWrapper,
      handleDragOverWrapper,
      handleDragLeaveWrapper
    }
  }
}
</script>

<style scoped>
/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease;
}

/* Dragging styles */
[draggable="true"] {
  cursor: move;
}

[draggable="true"]:active {
  cursor: grabbing;
}
</style>