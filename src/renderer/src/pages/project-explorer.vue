<template>
  <div class="flex flex-col h-full border-l border-black/10 dark:border-zinc-800">
    <!-- Project Header with Back Button -->
    <div class="h-12 flex items-center justify-between shrink-0 drag bg-white/40 dark:bg-zinc-900 pr-3"
      :class="[!sidebarOpen ? 'pl-20' : 'pl-4']">
      <div class="flex items-center gap-2">
        <!-- Show sidebar button when hidden -->
        <Button v-if="!sidebarOpen" icon-name="panel-left-open" size="sm" variant="ghost" class="text-zinc-500"
          @click="uiStore.toggleSidebar" />
        <h3 class="text-sm font-medium">
          {{ selectedProject?.name }}
        </h3>
      </div>
      <div class="flex items-center gap-4">
        <div class="relative">
          <Icon name="search" class="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-500" />
          <input v-model="searchQuery" type="text" placeholder="Search"
            class="w-50 pl-7 pr-3 py-1 dark:bg-zinc-800/50 bg-black/6 bg-white ring-1 text-current text-[13px] rounded-smooth-md focus:border-zinc-300 focus:outline-none focus:ring-2 ring-black/12 dark:ring-zinc-700/50 dark:focus:ring-zinc-600 dark:placeholder-zinc-500 placeholder-zinc-500" />
        </div>
      </div>

    </div>

    <!-- File Explorer Table -->
    <div class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
      <!-- Table Header -->
      <div class="border-y dark:border-zinc-800 border-black/10 z-10 shrink-0">
        <div class="flex px-3 py-1 text-[11px] dark:text-zinc-500 text-zinc-500">
          <div class="flex-1">Name</div>
          <div class="w-24">Files</div>
          <div class="w-28">Size</div>
          <div class="w-24">Status</div>
        </div>
      </div>

      <!-- Table Body with drop zone -->
      <div class="flex-1 overflow-y-auto h-full" @drop.prevent="handleDropOnRoot($event)"
        @dragover.prevent="handleDragOverRoot($event)" @dragleave="handleDragLeaveRoot($event)" @dragenter.prevent
        @contextmenu.prevent="handleContextMenu">
        <div class="min-h-full pt-1.5">
          <!-- Root Items using recursive component -->
          <FileSystemItem v-for="(item, index) in rootItems" :key="item.id" :item="item" :depth="0"
            :expanded-folders="expandedFolders" :drag-over-folder="dragOverFolder" :get-folder-items="getFolderItems"
            :get-folder-video-count="getFolderVideoCount" :last-expanded-folder="lastExpandedFolder"
            :get-ancestor-ids="getAncestorIds" :is-last-child="index === rootItems.length - 1"
            :editing-item-id="editingItemId" @set-editing-item="editingItemId = $event"
            @toggle-folder="toggleFolder" @drag-start="handleDragStartWrapper" @drag-end="handleDragEnd"
            @drop="handleDropWrapper" @drag-over="handleDragOverWrapper" @drag-leave="handleDragLeaveWrapper"
            @external-drop="handleExternalDropWrapper" @cancel-encoding="handleCancelEncoding" @rename="handleRename" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { useVideoEncodingStore } from '@/stores/videoEncoding'
import { useUIStore } from '@/stores/ui'
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
    const videoEncodingStore = useVideoEncodingStore()
    const uiStore = useUIStore()
    const { selectedProject } = storeToRefs(projectsStore)
    const { sidebarOpen } = storeToRefs(uiStore)
    const { currentParams } = storeToRefs(router)
    const {
      getProjectFileSystem,
      getVideosInFolder,
      getFolderVideoCount,
      moveFileSystemItem,
      debugFileSystem,
      selectProject
    } = projectsStore
    const { fileSystem } = storeToRefs(projectsStore)

    const expandedFolders = ref(new Set())
    const draggedItem = ref(null)
    const dragOverFolder = ref(null)
    const lastExpandedFolder = ref(null)
    const searchQuery = ref('')
    const viewMode = ref('list') // 'list' or 'gallery'
    const editingItemId = ref(null) // Track which item is being edited
    
    let unsubscribeMenu = null
    
    // Watch for route param changes to sync project selection
    watch(() => currentParams.value.projectId, (projectId) => {
      if (projectId && selectedProject.value?.id !== projectId) {
        selectProject(projectId)
      }
    }, { immediate: true })
    
    // Ensure we have a project selected
    onMounted(() => {
      if (!selectedProject.value && currentParams.value.projectId) {
        selectProject(currentParams.value.projectId)
      }
    })

    // Helper function to recursively filter items
    const filterItems = (items, query) => {
      if (!query) return items

      const lowerQuery = query.toLowerCase()
      const filteredItems = []

      items.forEach(item => {
        // Check if this item matches
        if (item.name.toLowerCase().includes(lowerQuery)) {
          filteredItems.push(item)
        } else if (item.type === 'folder') {
          // Check if any children match
          const children = fileSystem.value.filter(child => child.parentId === item.id)
          const filteredChildren = filterItems(children, query)

          if (filteredChildren.length > 0) {
            // Include folder if it has matching children
            filteredItems.push(item)
            // Auto-expand folders with matching children
            expandedFolders.value.add(item.id)
          }
        }
      })

      return filteredItems
    }

    const rootItems = computed(() => {
      const allRootItems = getProjectFileSystem(selectedProject.value?.id)
      return filterItems(allRootItems, searchQuery.value)
    })

    const getFolderItems = (folderId) => {
      let items = fileSystem.value
        .filter(item => item.parentId === folderId)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(item => {
          // Defensive check - ensure item has a type
          if (!item.type) {
            console.error(`Item ${item.id} (${item.name}) is missing type property!`)
          }
          return item
        })

      // Apply search filter if query exists
      if (searchQuery.value) {
        items = filterItems(items, searchQuery.value)
      }

      return items
    }

    const toggleFolder = (folderId) => {
      if (expandedFolders.value.has(folderId)) {
        expandedFolders.value.delete(folderId)
        // If we're closing the last expanded folder, clear it
        if (folderId === lastExpandedFolder.value) {
          lastExpandedFolder.value = null
        }
      } else {
        expandedFolders.value.add(folderId)
        // Always update lastExpandedFolder when any folder is expanded
        lastExpandedFolder.value = folderId
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

    // Helper to get all ancestor IDs of an item
    const getAncestorIds = (itemId) => {
      const ancestors = []
      let current = fileSystem.value.find(i => i.id === itemId)
      while (current && current.parentId) {
        ancestors.push(current.parentId)
        current = fileSystem.value.find(i => i.id === current.parentId)
      }
      return ancestors
    }

    // Root level drop handlers
    const handleDragOverRoot = (e) => {
      e.preventDefault()
      e.stopPropagation()

      if (!draggedItem.value) return

      e.dataTransfer.dropEffect = 'move'
    }

    const handleDragLeaveRoot = (e) => {
      // Only process if we're leaving the entire container
      if (e.currentTarget === e.target) {
        // No visual feedback needed
      }
    }

    const handleDropOnRoot = async (e) => {
      console.log('handleDropOnRoot called', e.target, draggedItem.value)
      e.preventDefault()
      e.stopPropagation()

      // Check if this is an external file drop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleExternalFileDrop(e.dataTransfer.files, null)
        return
      }

      // Otherwise handle internal drag and drop
      if (!draggedItem.value) {
        console.log('No dragged item')
        return
      }

      // Don't move if already at root
      if (draggedItem.value.parentId === null) {
        console.log('Item already at root')
        draggedItem.value = null
        return
      }

      // Use the store method to move the item to root (parentId = null)
      const success = moveFileSystemItem(draggedItem.value.id, null)

      if (success) {
        console.log(`Moved ${draggedItem.value.name} to root`)
      }

      draggedItem.value = null
    }

    // Handle external files being dropped
    const handleExternalFileDrop = async (files, parentId) => {
      const videoFiles = Array.from(files).filter(file => {
        const ext = file.name.split('.').pop().toLowerCase()
        return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
      })

      if (videoFiles.length === 0) {
        console.log('No video files found in drop')
        return
      }

      // Add videos to the file system and start encoding
      for (const [index, file] of videoFiles.entries()) {
        try {
          // Get file path - Electron specific handling
          let filePath = file.path

          // If no path, try webkitRelativePath
          if (!filePath && file.webkitRelativePath) {
            filePath = file.webkitRelativePath
          }

          // If still no path, try electron's webUtils
          if (!filePath && window.electron?.webUtils?.getPathForFile) {
            filePath = window.electron.webUtils.getPathForFile(file)
          }

          if (!filePath) {
            throw new Error('File path not available - please use Browse Files option')
          }

          // Queue the video for encoding with the path
          const job = await videoEncodingStore.queueVideo(filePath)

          // Add to file system with job ID
          const newVideo = {
            id: `fs_${job.id}`,
            type: 'video',
            name: file.name,
            parentId: parentId,
            projectId: selectedProject.value?.id,
            duration: job.validation.metadata?.duration || '0:00',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            orderIndex: fileSystem.value.filter(i => i.parentId === parentId).length + index,
            status: 'queued',
            progress: 0,
            jobId: job.id,
            filePath: file.path
          }
          fileSystem.value.push(newVideo)

          console.log(`Started encoding: ${file.name}`)
        } catch (error) {
          console.error(`Failed to queue video ${file.name}:`, error)

          // Add as failed
          const failedVideo = {
            id: `fs_failed_${Date.now()}_${index}`,
            type: 'video',
            name: file.name,
            parentId: parentId,
            projectId: selectedProject.value?.id,
            duration: '0:00',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            orderIndex: fileSystem.value.filter(i => i.parentId === parentId).length + index,
            status: 'failed',
            error: error.message
          }
          fileSystem.value.push(failedVideo)
        }
      }
    }

    // Map encoding jobs to file system items
    const jobToFileSystemMap = new Map()

    // Watch for job updates from the video encoding store
    const unsubscribeProgress = window.api.video.onProgress((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.progress = Math.round(data.global * 100)
        item.status = 'processing'
      }
    })

    const unsubscribeComplete = window.api.video.onComplete((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.status = 'ready'
        item.progress = 100
        if (data.metadata?.duration) {
          // Format duration from seconds to MM:SS
          const seconds = Math.floor(data.metadata.duration)
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          item.duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        }
      }
    })

    const unsubscribeError = window.api.video.onError((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.status = 'failed'
        item.error = data.error
      }
    })

    const unsubscribeCancelled = window.api.video.onCancelled?.((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.status = 'failed'
        item.error = 'Cancelled by user'
      }
    })

    // Clean up listeners on unmount
    onUnmounted(() => {
      unsubscribeProgress?.()
      unsubscribeComplete?.()
      unsubscribeError?.()
      unsubscribeCancelled?.()
      unsubscribeMenu?.()
    })

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

    const handleExternalDropWrapper = ({ files, folderId }) => {
      handleExternalFileDrop(files, folderId)
    }

    const handleCancelEncoding = async (jobId) => {
      try {
        await videoEncodingStore.cancelJob(jobId)
        console.log(`Cancelled encoding job: ${jobId}`)
      } catch (error) {
        console.error(`Failed to cancel job ${jobId}:`, error)
      }
    }

    const browseFiles = async () => {
      const files = await window.api.video.selectFiles()
      if (files && files.length > 0) {
        // Process files from browse dialog (these already have paths)
        for (const [index, file] of files.entries()) {
          try {
            // Queue the video for encoding
            const job = await videoEncodingStore.queueVideo(file.path)

            // Add to file system with job ID
            const newVideo = {
              id: `fs_${job.id}`,
              type: 'video',
              name: file.name,
              parentId: null, // Add to root
              projectId: selectedProject.value?.id,
              duration: job.validation.metadata?.duration || '0:00',
              size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
              orderIndex: fileSystem.value.filter(i => i.parentId === null).length + index,
              status: 'queued',
              progress: 0,
              jobId: job.id,
              filePath: file.path
            }
            fileSystem.value.push(newVideo)

            console.log(`Started encoding: ${file.name}`)
          } catch (error) {
            console.error(`Failed to queue video ${file.name}:`, error)
          }
        }
      }
    }

    const goToSettings = () => {
      router.navigateTo('settings')
    }
    
    const handleContextMenu = async (e) => {
      // Check if clicked on empty space (not on an item)
      if (e.target.closest('[draggable="true"]')) {
        return // Let the item handle its own context menu
      }
      
      const menuTemplate = [
        {
          label: 'New Folder',
          action: 'explorer:newFolder'
        },
        { type: 'separator' },
        {
          label: 'View',
          submenu: [
            {
              label: 'as List',
              type: 'radio',
              checked: viewMode.value === 'list',
              action: 'explorer:viewList'
            },
            {
              label: 'as Gallery',
              type: 'radio',
              checked: viewMode.value === 'gallery',
              action: 'explorer:viewGallery'
            }
          ]
        }
      ]
      
      await window.api.menu.showContext(menuTemplate, {
        x: e.clientX,
        y: e.clientY
      })
    }
    
    const handleMenuAction = (action, data) => {
      // Handle menu actions centrally
      switch (action) {
        case 'explorer:newFolder':
          createNewFolder()
          break
          
        case 'explorer:viewList':
          viewMode.value = 'list'
          break
          
        case 'explorer:viewGallery':
          viewMode.value = 'gallery'
          break
          
        case 'file:rename':
        case 'folder:rename':
          // Set the specific item to be edited
          editingItemId.value = data.itemId
          break
          
        case 'file:delete':
          // Optimistically delete video
          handleDelete(data.itemId, data.itemName, data.itemType)
          break
          
        case 'folder:delete':
          // Delete empty folder
          handleDelete(data.itemId, data.itemName, data.itemType)
          break
          
        case 'video:cancelJob':
          handleCancelEncoding(data.jobId)
          break
          
        case 'share:copyWebLink':
          navigator.clipboard.writeText(`https://app.framesend.com/files/${data.fileId}`)
          break
          
        case 'share:copyIframeEmbed':
          const embedCode = `<iframe src="https://app.framesend.com/embed/${data.fileId}\" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
          navigator.clipboard.writeText(embedCode)
          break
      }
    }
    
    const createNewFolder = () => {
      const folderName = prompt('Enter folder name:')
      if (!folderName) return
      
      const newFolder = {
        id: `folder_${Date.now()}`,
        type: 'folder',
        name: folderName,
        parentId: null,
        projectId: selectedProject.value?.id,
        orderIndex: fileSystem.value.filter(i => i.parentId === null).length
      }
      
      fileSystem.value.push(newFolder)
    }
    
    const handleRename = ({ itemId, oldName, newName, itemType }) => {
      const item = fileSystem.value.find(i => i.id === itemId)
      if (item) {
        item.name = newName
        console.log(`Renamed ${itemType} from "${oldName}" to "${newName}"`)
        // Clear editing state
        editingItemId.value = null
        // TODO: Persist to database/API later
      }
    }
    
    const handleDelete = (itemId, itemName, itemType) => {
      // Confirm deletion
      const confirmMessage = itemType === 'folder' 
        ? `Delete folder "${itemName}"?` 
        : `Delete video "${itemName}"?`
        
      if (confirm(confirmMessage)) {
        // Find the item index
        const index = fileSystem.value.findIndex(i => i.id === itemId)
        if (index !== -1) {
          // If it's a video that's encoding, cancel the job first
          const item = fileSystem.value[index]
          if (item.type === 'video' && item.jobId && (item.status === 'processing' || item.status === 'queued')) {
            handleCancelEncoding(item.jobId)
          }
          
          // Optimistically remove from UI
          fileSystem.value.splice(index, 1)
          console.log(`Deleted ${itemType}: "${itemName}"`)
          
          // TODO: Persist deletion to database/API
        }
      }
    }
    
    // Set up menu action listener
    onMounted(() => {
      unsubscribeMenu = window.api.menu.onAction(handleMenuAction)
    })

    return {
      router,
      selectedProject,
      rootItems,
      expandedFolders,
      dragOverFolder,
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
      handleDragLeaveWrapper,
      handleExternalDropWrapper,
      handleCancelEncoding,
      browseFiles,
      goToSettings,
      getAncestorIds,
      lastExpandedFolder,
      searchQuery,
      sidebarOpen,
      uiStore,
      currentParams,
      handleContextMenu,
      viewMode,
      handleRename,
      handleDelete,
      editingItemId
    }
  }
}
</script>

<style scoped>
/* Dragging styles */
[draggable="true"] {
  cursor: move;
}

[draggable="true"]:active {
  cursor: grabbing;
}
</style>