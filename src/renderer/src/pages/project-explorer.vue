<template>
  <div class="flex flex-col h-full bg-zinc-900 pt-6">
    <!-- Project Header with Back Button -->
    <div class="px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-lg font-semibold text-zinc-100">{{ selectedProject?.name }}</h1>
        </div>
      </div>
      <Button variant="default" icon-name="plus" @click="browseFiles" class="text-sm">
        Add Videos
      </Button>
    </div>

    <!-- File Explorer Table -->
    <div class="flex-1 overflow-y-auto" @drop.prevent="handleDropOnRoot($event)"
      @dragover.prevent="handleDragOverRoot($event)" @dragleave="handleDragLeaveRoot($event)" @dragenter.prevent>
      <div class="min-h-0 flex-1">
        <!-- Table Header -->
        <div class="sticky top-0 bg-zinc-900 border-b border-zinc-700 z-10">
          <div class="flex px-6 py-3 text-[11px] text-zinc-500">
            <div class="flex-1">Name</div>
            <div class="w-24 text-center">Files</div>
            <div class="w-28 text-right">Size</div>
            <div class="w-24 text-center">Status</div>
          </div>
        </div>

        <!-- Table Body -->
        <div>
          <!-- Root Items using recursive component -->
          <FileSystemItem v-for="item in rootItems" :key="item.id" :item="item" :depth="0"
            :expanded-folders="expandedFolders" :drag-over-folder="dragOverFolder" :get-folder-items="getFolderItems"
            :get-folder-video-count="getFolderVideoCount" @toggle-folder="toggleFolder"
            @drag-start="handleDragStartWrapper" @drag-end="handleDragEnd" @drop="handleDropWrapper"
            @drag-over="handleDragOverWrapper" @drag-leave="handleDragLeaveWrapper"
            @external-drop="handleExternalDropWrapper" @cancel-encoding="handleCancelEncoding" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { useVideoEncodingStore } from '@/stores/videoEncoding'
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

      e.dataTransfer.dropEffect = 'move'
    }

    const handleDragLeaveRoot = (e) => {
      // Only process if we're leaving the entire container
      if (e.currentTarget === e.target) {
        // No visual feedback needed
      }
    }

    const handleDropOnRoot = async (e) => {
      e.preventDefault()
      e.stopPropagation()

      // Check if this is an external file drop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleExternalFileDrop(e.dataTransfer.files, null)
        return
      }

      // Otherwise handle internal drag and drop
      if (!draggedItem.value) {
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
            status: 'encoding',
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
            status: 'error',
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
        item.status = 'encoding'
      }
    })

    const unsubscribeComplete = window.api.video.onComplete((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.status = 'encoded'
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
        item.status = 'error'
        item.error = data.error
      }
    })

    const unsubscribeCancelled = window.api.video.onCancelled?.((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.status = 'cancelled'
      }
    })

    // Clean up listeners on unmount
    onUnmounted(() => {
      unsubscribeProgress?.()
      unsubscribeComplete?.()
      unsubscribeError?.()
      unsubscribeCancelled?.()
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
              status: 'encoding',
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
      browseFiles
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