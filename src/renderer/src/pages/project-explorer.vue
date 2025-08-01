<template>
<div class="flex flex-col h-full">
  <!-- Project Header with Back Button -->
  <div class="h-12 flex items-center justify-between shrink-0 drag pr-3 border-b border-zinc-700/50"
    :class="[!sidebarOpen ? 'pl-20' : 'pl-4']">
    <div class="flex items-center gap-2">
      <!-- Show sidebar button when hidden -->
      <Button v-if="!sidebarOpen" icon-name="panel-left-open" size="sm" variant="ghost" class="text-zinc-500"
        @click="uiStore.toggleSidebar" />
      <!-- Breadcrumb navigation for gallery view -->
      <div v-if="viewMode === 'gallery'" class="flex items-center gap-2.5">
        <!-- Show as button with chevron if inside a folder, otherwise just text -->
        <Button v-if="currentFolderId" variant="ghost" size="default" chevron
          class="text-sm font-medium -ml-2 -mr-2"
          @click="showBreadcrumbMenu">
          {{ currentFolderName }}
        </Button>
        <h3 v-else class="text-sm font-medium flex-1 truncate">
          {{ currentFolderName }}
        </h3>
      </div>
      <!-- Project name for list view -->
      <h3 v-else class="text-sm font-medium flex-1 truncate">
        {{ selectedProject?.name }}
      </h3>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative">
        <Icon name="search" class="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-500" />
        <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder"
          class="w-50 pl-7 pr-3 py-1 bg-zinc-800/50 ring-1 text-current text-[13px] rounded-smooth-md focus:border-zinc-300 focus:outline-none focus:ring-2 ring-zinc-700/50 focus:ring-zinc-600 placeholder-zinc-500" />
      </div>
    </div>

  </div>

  <!-- File Explorer Table / Gallery -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Table Header (List View Only) -->
    <div v-if="viewMode === 'list'" class="border-b border-zinc-800 z-10 shrink-0">
      <div class="flex px-3 py-1 text-[11px] text-zinc-500">
        <div class="flex-1">Name</div>
        <div class="w-28 text-right pr-3">Size</div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'" class="flex-1 overflow-y-auto h-full" @drop.prevent="handleDropOnRoot($event)"
      @dragover.prevent="handleDragOverRoot($event)" @dragleave="handleDragLeaveRoot($event)" @dragenter.prevent
      @contextmenu.prevent="handleContextMenu" @click="handleRootClick">
      <!-- Empty State -->
      <div v-if="rootItems.length === 0" class="flex flex-col items-center justify-center h-full text-zinc-500">
        <Icon name="folder-open" class="size-16 mb-4 text-zinc-700" :stroke-width="1.5" />
        <p class="text-sm font-medium mb-1">No files in this project</p>
        <p class="text-xs text-zinc-600">Upload videos to get started</p>
      </div>

      <!-- File list -->
      <div v-else class="min-h-full pt-1.5">
        <!-- Root Items using recursive component -->
        <FileSystemItem v-for="(item, index) in rootItems" :key="item.id" :item="item" :depth="0"
          :expanded-folders="expandedFolders" :drag-over-folder="dragOverFolder" :get-folder-items="getFolderItems"
          :get-folder-video-count="getFolderVideoCount" :last-expanded-folder="lastExpandedFolder"
          :get-ancestor-ids="getAncestorIds" :is-last-child="index === rootItems.length - 1"
          :editing-item-id="editingItemId" @set-editing-item="editingItemId = $event" @toggle-folder="toggleFolder"
          @drag-start="handleDragStartWrapper" @drag-end="handleDragEnd" @drop="handleDropWrapper"
          @drag-over="handleDragOverWrapper" @drag-leave="handleDragLeaveWrapper"
          @external-drop="handleExternalDropWrapper" @cancel-encoding="handleCancelEncoding" @rename="handleRename"
          @context-menu="handleListItemContextMenu" />
      </div>
    </div>

    <!-- Gallery View -->
    <div v-else class="flex-1 overflow-y-auto h-full p-4" @drop.prevent="handleDropOnRoot($event)"
      @dragover.prevent="handleDragOverRoot($event)" @dragleave="handleDragLeaveRoot($event)" @dragenter.prevent
      @contextmenu.prevent="handleContextMenu" @click="handleRootClick">
      <!-- Empty State -->
      <div v-if="rootItems.length === 0" class="flex flex-col items-center justify-center h-full text-zinc-500">
        <Icon name="folder-open" class="size-16 mb-4 text-zinc-700" :stroke-width="1.5" />
        <p class="text-sm font-medium mb-1">{{ emptyStateTitle }}</p>
        <p class="text-xs text-zinc-600">{{ emptyStateMessage }}</p>
      </div>

      <!-- Grid of items -->
      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <GalleryItem
          v-for="item in rootItems"
          :key="item.id"
          :item="item"
          :is-editing="editingItemId === item.id"
          :is-drag-over="dragOverFolder === item.id"
          :is-selected="uiStore.selectedItem && uiStore.selectedItem.id === item.id"
          :folder-videos="item.type === 'folder' ? getVideosInFolder(item.id).filter(v => v.status === 'ready') : []"
          :folder-video-count="item.type === 'folder' ? getFolderVideoCount(item.id) : 0"
          :folder-size="item.type === 'folder' ? getFolderSize(item.id) : '-'"
          :thumbnail="item.type === 'video' ? getThumbnailForItem(item) : null"
          @click="handleVideoClick"
          @double-click="navigateToFolder(item.id)"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @drag-over="handleDragOver"
          @drag-leave="handleDragLeave"
          @drop="handleDrop"
          @context-menu="handleItemContextMenu"
          @rename="handleGalleryRename"
          @cancel-edit="editingItemId = null" />
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { ref, computed, onUnmounted, watch, onMounted, nextTick } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { useVideoEncodingStore } from '@/stores/videoEncoding'
import { useUIStore } from '@/stores/ui'
import { useVideoMetadataStore } from '@/stores/videoMetadata'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import { apiService } from '@/services/api'
import { useKeybindings } from '@/composables/useKeybinding'
import Icon from '@components/base/Icon.vue'
import Button from '@components/base/Button.vue'
import FileSystemItem from '@components/FileSystemItem.vue'
import FolderThumbnailPreview from '@components/FolderThumbnailPreview.vue'
import PlaceholderImage from '@components/PlaceholderImage.vue'
import GalleryItem from '@components/GalleryItem.vue'

export default {
  name: 'ProjectExplorerPage',
  components: {
    Icon,
    Button,
    FileSystemItem,
    FolderThumbnailPreview,
    PlaceholderImage,
    GalleryItem
  },
  meta: {
    title: 'Project Explorer'
  },
  setup() {
    const projectsStore = useProjectsStore()
    const router = useRouterStore()
    const videoEncodingStore = useVideoEncodingStore()
    const uiStore = useUIStore()
    const metadataStore = useVideoMetadataStore()
    const settingsStore = useSettingsStore()
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
    const viewMode = computed({
      get: () => settingsStore.viewMode,
      set: (value) => {
        settingsStore.viewMode = value
      }
    })
    const editingItemId = ref(null) // Track which item is being edited
    const currentFolderId = ref(null) // Track current folder for gallery view
    const navigationPath = ref([]) // Breadcrumb path for gallery view

    let unsubscribeMenu = null

    // Watch for route param changes to sync project selection and folder navigation
    watch(() => currentParams.value, (newParams, oldParams) => {
      // Handle project change
      if (newParams.projectId && (!selectedProject.value || selectedProject.value.id !== newParams.projectId)) {
        selectProject(newParams.projectId)
      }

      // Handle folder navigation in gallery view
      if (viewMode.value === 'gallery') {
        // If folderId changed, update current folder
        if (newParams.folderId !== oldParams?.folderId) {
          currentFolderId.value = newParams.folderId || null
          navigationPath.value = buildNavigationPath(newParams.folderId || null)
        }

        // If switching projects, ensure we're at the right folder
        if (newParams.projectId !== oldParams?.projectId) {
          if (!newParams.folderId) {
            currentFolderId.value = null
            navigationPath.value = [{ id: null, name: selectedProject.value?.name || 'Project' }]
          }
        }
      }
    }, { immediate: true, deep: true })

    // Watch for selected project changes to reset gallery view
    watch(() => selectedProject.value, (newProject, oldProject) => {
      if (newProject && (!oldProject || newProject.id !== oldProject.id)) {
        if (viewMode.value === 'gallery') {
          // Reset to root folder when switching projects
          currentFolderId.value = null
          navigationPath.value = [{ id: null, name: newProject.name || 'Project' }]
        }
      }
    }, { deep: true })

    // Watch for view mode changes to persist preference
    watch(viewMode, (newMode, oldMode) => {
      // Update application menu to reflect current view mode
      if (window.api?.menu?.updateViewMode) {
        window.api.menu.updateViewMode(newMode)
      } else if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('menu:updateViewMode', newMode)
      }

      // When switching from list to gallery via any method (not just menu)
      if (newMode === 'gallery' && oldMode === 'list') {
        // Always start at root when switching from list to gallery
        currentFolderId.value = null
        navigationPath.value = [{ id: null, name: selectedProject.value?.name || 'Project' }]
        router.navigateTo('project-explorer', { projectId: selectedProject.value?.id })
      }
    })

    // Watch for editing state changes to handle cancelled new folders
    watch(editingItemId, (newValue, oldValue) => {
      if (oldValue && !newValue) {
        // Editing was cancelled, check if it was a new folder that needs to be deleted
        const item = fileSystem.value.find(i => i.id === oldValue)
        if (item && item.type === 'folder' && item.name.startsWith('New Folder')) {
          // This is a new folder that wasn't renamed, delete it
          const index = fileSystem.value.findIndex(i => i.id === oldValue)
          if (index !== -1) {
            fileSystem.value.splice(index, 1)
            console.log('Deleted cancelled new folder')
          }
        }
      }
    })

    // Ensure we have a project selected
    onMounted(() => {
      if (!selectedProject.value && currentParams.value.projectId) {
        selectProject(currentParams.value.projectId)
      }

      // Check if gallery mode and set folder from route params
      if (viewMode.value === 'gallery') {
        // Check for folderId in route params
        const folderId = currentParams.value.folderId
        if (folderId) {
          currentFolderId.value = folderId
          navigationPath.value = buildNavigationPath(folderId)
        } else {
          currentFolderId.value = null
          navigationPath.value = [{ id: null, name: selectedProject.value?.name || 'Project' }]
        }
      }

      // Sync the loaded view mode with the application menu
      // Use setTimeout to ensure menu is ready
      setTimeout(() => {
        if (window.api?.menu?.updateViewMode) {
          window.api.menu.updateViewMode(viewMode.value)
        } else if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.send('menu:updateViewMode', viewMode.value)
        }
      }, 100)
    })

    // Watch for metadata changes and sync with file system
    watch(() => metadataStore.metadata, () => {
      // Update file system items with metadata changes
      metadataStore.metadata.forEach((meta, jobId) => {
        // Find the corresponding video in file system by jobId
        const item = fileSystem.value.find(i => i.jobId === jobId)
        if (item && item.name !== meta.name) {
          item.name = meta.name
        }
      })
    }, { deep: true })

    // Helper function to format bytes to human readable format
    const formatBytes = (bytes, decimals = 1) => {
      if (bytes === 0) return '0 B'

      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }

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
      if (viewMode.value === 'gallery') {
        // In gallery view, show items from current folder
        const items = fileSystem.value
          .filter(item => item.parentId === currentFolderId.value && item.projectId === selectedProject.value?.id)
          .sort((a, b) => {
            // Folders first, then by name
            if (a.type === 'folder' && b.type !== 'folder') return -1
            if (a.type !== 'folder' && b.type === 'folder') return 1
            return a.name.localeCompare(b.name)
          })
        return filterItems(items, searchQuery.value)
      } else {
        // In list view, show hierarchical structure
        const allRootItems = getProjectFileSystem(selectedProject.value?.id)
        return filterItems(allRootItems, searchQuery.value)
      }
    })

    // Computed property for current folder name in gallery view
    const currentFolderName = computed(() => {
      if (!currentFolderId.value) {
        return selectedProject.value?.name || 'Project'
      }
      const folder = fileSystem.value.find(item => item.id === currentFolderId.value)
      return folder?.name || 'Folder'
    })

    // Computed property for search placeholder
    const searchPlaceholder = computed(() => {
      if (viewMode.value === 'list' || !currentFolderId.value) {
        // List view or gallery at root level
        return 'Search in project'
      } else {
        // Gallery view inside a folder
        return 'Search in folder'
      }
    })

    // Computed properties for empty state messages
    const emptyStateTitle = computed(() => {
      return currentFolderId.value ? 'This folder is empty' : 'No files in this project'
    })

    const emptyStateMessage = computed(() => {
      return currentFolderId.value ? 'Add videos to see them here' : 'Upload videos to get started'
    })

    // Build navigation path for breadcrumb
    const buildNavigationPath = (folderId) => {
      const path = []
      let current = folderId

      while (current) {
        const folder = fileSystem.value.find(item => item.id === current)
        if (folder) {
          path.unshift({ id: folder.id, name: folder.name })
          current = folder.parentId
        } else {
          break
        }
      }

      // Add project root
      path.unshift({ id: null, name: selectedProject.value?.name || 'Project' })

      return path
    }

    // Navigate to a folder in gallery view
    const navigateToFolder = (folderId) => {
      if (viewMode.value !== 'gallery') return

      // Update router with folder navigation
      const params = {
        projectId: selectedProject.value?.id,
        folderId: folderId
      }

      router.navigateTo('project-explorer', params)
    }

    // Show breadcrumb dropdown menu
    const showBreadcrumbMenu = async (e) => {
      const menuItems = []

      // Current folder with checkmark
      menuItems.push({
        label: currentFolderName.value,
        type: 'normal',
        checked: true,
        enabled: false
      })

      // Add separator if there are parent folders
      if (navigationPath.value.length > 1) {
        menuItems.push({ type: 'separator' })
      }

      // Add parent folders (skip the current one which is last in path)
      for (let i = navigationPath.value.length - 2; i >= 0; i--) {
        const pathItem = navigationPath.value[i]
        menuItems.push({
          label: pathItem.name,
          action: 'breadcrumb:navigate',
          data: { folderId: pathItem.id }
        })
      }

      // Get the button element properly
      const button = e.currentTarget || e.target
      const rect = button.getBoundingClientRect()

      await window.api.menu.showContext(menuItems, {
        x: Math.round(rect.left),
        y: Math.round(rect.bottom)
      })
    }

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

    const handleDrop = async (e, folderId) => {
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
      const success = await moveFileSystemItem(draggedItem.value.id, folderId)

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

      // Determine target folder based on view mode
      const targetFolderId = viewMode.value === 'gallery' ? currentFolderId.value : null

      // Check if this is an external file drop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleExternalFileDrop(e.dataTransfer.files, targetFolderId)
        return
      }

      // Otherwise handle internal drag and drop
      if (!draggedItem.value) {
        console.log('No dragged item')
        return
      }

      // Don't move if already in target location
      if (draggedItem.value.parentId === targetFolderId) {
        console.log('Item already in target location')
        draggedItem.value = null
        return
      }

      // Use the store method to move the item
      const success = await moveFileSystemItem(draggedItem.value.id, targetFolderId)

      if (success) {
        console.log(`Moved ${draggedItem.value.name} to ${targetFolderId ? 'folder' : 'root'}`)
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

          // Initialize metadata for this video
          metadataStore.initializeMetadata(job.id, {
            name: file.name,
            projectId: selectedProject.value?.id,
            filePath: filePath
          })

          // Add to file system with job ID
          const newVideo = {
            id: `fs_${job.id}`,
            type: 'video',
            name: file.name,
            parentId: parentId,
            projectId: selectedProject.value?.id,
            duration: job.validation.metadata?.duration || '0:00',
            size: null, // Will be set when encoding starts
            originalSize: file.size, // Keep original size for reference
            encodedSize: 0, // Will be updated during encoding
            orderIndex: fileSystem.value.filter(i => i.parentId === parentId).length + index,
            status: 'queued',
            progress: 0,
            jobId: job.id,
            filePath: file.path
          }
          fileSystem.value.push(newVideo)

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
            size: null, // Failed videos don't have encoded size,
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

        // Update encoded size if available
        if (data.encodedSize !== undefined && data.encodedSize > 0) {
          item.encodedSize = data.encodedSize
          item.size = formatBytes(data.encodedSize)
          console.log(`[Renderer] Updated ${item.name} size to ${item.size}`)
        }
      }
    })

    const unsubscribeComplete = window.api.video.onComplete((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        item.status = 'ready'
        item.progress = 100

        // Set final encoded size
        if (data.metadata?.outputSize) {
          item.encodedSize = data.metadata.outputSize
          item.size = formatBytes(data.metadata.outputSize)
        }

        if (data.metadata?.duration) {
          // Format duration from seconds to MM:SS
          const seconds = Math.floor(data.metadata.duration)
          const minutes = Math.floor(seconds / 60)
          const remainingSeconds = seconds % 60
          item.duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        }

        // Ensure thumbnailPath is preserved from earlier thumbnail event
        // The thumbnail should already be set from the thumbnail:ready event
        // but let's clear the cache to force a reload with the final thumbnail
        if (item.thumbnailPath) {
          thumbnailCache.value.delete(item.id)
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
      const itemIndex = fileSystem.value.findIndex(i => i.jobId === data.jobId)
      if (itemIndex !== -1) {
        // Remove cancelled video from the UI
        fileSystem.value.splice(itemIndex, 1)
      }
    })

    const unsubscribeThumbnail = window.api.video.onThumbnail?.((data) => {
      const item = fileSystem.value.find(i => i.jobId === data.jobId)
      if (item) {
        // Update the item with thumbnail path
        item.thumbnailPath = data.thumbnailPath
        item.thumbnailIsTemporary = data.isTemporary

        // Clear cache for this item to force reload with new thumbnail
        thumbnailCache.value.delete(item.id)

        // Force reactivity update
        const index = fileSystem.value.findIndex(i => i.jobId === data.jobId)
        if (index !== -1) {
          fileSystem.value[index] = { ...item }
        }
      }
    })

    // Clean up listeners on unmount
    onUnmounted(() => {
      unsubscribeProgress?.()
      unsubscribeComplete?.()
      unsubscribeError?.()
      unsubscribeCancelled?.()
      unsubscribeThumbnail?.()
      unsubscribeMenu?.()

      // Remove application menu listeners
      window.electron?.ipcRenderer?.removeAllListeners('menu:action')
      window.electron?.ipcRenderer?.removeAllListeners('menu:getViewMode')
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

            // Initialize metadata for this video
            metadataStore.initializeMetadata(job.id, {
              name: file.name,
              projectId: selectedProject.value?.id,
              filePath: file.path
            })

            // Add to file system with job ID
            const newVideo = {
              id: `fs_${job.id}`,
              type: 'video',
              name: file.name,
              parentId: null, // Add to root
              projectId: selectedProject.value?.id,
              duration: job.validation.metadata?.duration || '0:00',
              size: null, // Will be set when encoding starts
              originalSize: file.size, // Keep original size for reference
              encodedSize: 0, // Will be updated during encoding
              orderIndex: fileSystem.value.filter(i => i.parentId === null).length + index,
              status: 'queued',
              progress: 0,
              jobId: job.id,
              filePath: file.path
            }
            fileSystem.value.push(newVideo)

          } catch (error) {
            console.error(`Failed to queue video ${file.name}:`, error)
          }
        }
      }
    }

    const goToSettings = () => {
      router.navigateTo('settings')
    }

    const handleVideoClick = (item) => {
      // Select the item (folder or video)
      uiStore.selectItem(item)
    }

    const handleItemContextMenu = async (e, item) => {
      let menuTemplate = []

      if (item.type === 'video') {
        menuTemplate = [
          {
            label: 'Share',
            submenu: [
              {
                label: 'Copy Web Link',
                action: 'share:copyWebLink',
                data: { fileId: item.id, fileName: item.name }
              },
              {
                label: 'Copy iFrame Embed',
                action: 'share:copyIframeEmbed',
                data: { fileId: item.id, fileName: item.name }
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Download',
            submenu: [
              {
                label: 'MP4 (H.264)',
                submenu: [
                  {
                    label: '360p',
                    action: 'download:mp4',
                    data: { fileId: item.id, format: 'mp4', quality: '360p' },
                    enabled: item.status === 'ready'
                  },
                  {
                    label: '720p',
                    action: 'download:mp4',
                    data: { fileId: item.id, format: 'mp4', quality: '720p' },
                    enabled: item.status === 'ready'
                  },
                  {
                    label: '1080p',
                    action: 'download:mp4',
                    data: { fileId: item.id, format: 'mp4', quality: '1080p' },
                    enabled: item.status === 'ready'
                  },
                  {
                    label: '2160p (4K)',
                    action: 'download:mp4',
                    data: { fileId: item.id, format: 'mp4', quality: '2160p' },
                    enabled: item.status === 'ready'
                  }
                ]
              },
              { type: 'separator' },
              {
                label: 'Raw File',
                action: 'download:raw',
                data: { fileId: item.id, format: 'raw' },
                enabled: true
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Rename',
            action: 'file:rename',
            data: { itemId: item.id, itemName: item.name, itemType: item.type }
          },
          {
            label: 'Delete',
            action: 'file:delete',
            data: { itemId: item.id, itemName: item.name, itemType: item.type }
          }
        ]

        // Add cancel option if video is encoding
        if ((item.status === 'processing' || item.status === 'queued') && item.jobId) {
          menuTemplate.unshift({
            label: `Cancel ${item.status === 'processing' ? 'Encoding' : 'Queued Job'}`,
            action: 'video:cancelJob',
            data: { jobId: item.jobId }
          })
          menuTemplate.splice(1, 0, { type: 'separator' })
        }
      } else if (item.type === 'folder') {
        const folderItems = getFolderItems(item.id)
        const isEmpty = folderItems.length === 0

        menuTemplate = [
          {
            label: 'Open',
            action: 'folder:open',
            data: { folderId: item.id }
          },
          { type: 'separator' },
          {
            label: 'Rename',
            action: 'folder:rename',
            data: { itemId: item.id, itemName: item.name, itemType: item.type }
          },
          {
            label: 'Delete',
            action: 'folder:delete',
            data: { itemId: item.id, itemName: item.name, itemType: item.type },
            enabled: isEmpty
          }
        ]
      }

      await window.api.menu.showContext(menuTemplate, {
        x: e.clientX,
        y: e.clientY
      })
    }

    const handleRootClick = (e) => {
      // Check if clicked directly on the root container (not on an item)
      if (e.target === e.currentTarget ||
        (!e.target.closest('[draggable="true"]') && !e.target.closest('.group'))) {
        // Clear selection
        uiStore.clearSelectedItem()
      }
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

    const handleMenuAction = async (action, data) => {
      // Handle menu actions centrally
      switch (action) {
        case 'explorer:newFolder':
          createNewFolder()
          break

        case 'explorer:viewList':
          // Remember the folder we were viewing in gallery mode
          const folderToExpand = currentFolderId.value

          viewMode.value = 'list'

          // Clear all expanded folders first
          expandedFolders.value.clear()

          // If we were viewing a folder in gallery mode, expand it and its ancestors
          if (folderToExpand) {
            // Expand the folder itself
            expandedFolders.value.add(folderToExpand)

            // Expand all parent folders to make it visible
            const ancestors = getAncestorIds(folderToExpand)
            ancestors.forEach(ancestorId => {
              expandedFolders.value.add(ancestorId)
            })

            // Set this folder as the last expanded to highlight it
            lastExpandedFolder.value = folderToExpand
          }

          currentFolderId.value = null
          navigationPath.value = []
          break

        case 'explorer:viewGallery':
          viewMode.value = 'gallery'
          // Always start at project root when switching from list view
          currentFolderId.value = null
          navigationPath.value = [{ id: null, name: selectedProject.value?.name || 'Project' }]
          // Update route to reflect root level
          router.navigateTo('project-explorer', { projectId: selectedProject.value?.id })
          break

        case 'breadcrumb:navigate':
          navigateToFolder(data.folderId)
          break

        case 'folder:open':
          if (viewMode.value === 'gallery') {
            navigateToFolder(data.folderId)
          }
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

        case 'folder:newFolder':
          // Create new folder inside the clicked folder
          createNewFolder(data.parentId)
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

    const createNewFolder = async (parentId = null) => {
      // In gallery view, create in current folder if no parentId specified
      if (viewMode.value === 'gallery' && parentId === null) {
        parentId = currentFolderId.value
      }

      // Generate a unique name for the folder
      let baseName = 'Untitled Folder'
      let counter = 1
      let folderName = baseName

      // Check for existing folders with the same name in the same parent
      const siblings = fileSystem.value.filter(i => i.parentId === parentId && i.type === 'folder')
      const existingNames = siblings.map(f => f.name)

      while (existingNames.includes(folderName)) {
        folderName = `${baseName} ${counter}`
        counter++
      }

      const tempId = `folder_${Date.now()}`
      const newFolder = {
        id: tempId,
        type: 'folder',
        name: folderName,
        parentId: parentId,
        projectId: selectedProject.value?.id,
        orderIndex: fileSystem.value.filter(i => i.parentId === parentId).length
      }

      // Optimistic update - add to UI immediately
      fileSystem.value.push(newFolder)

      // If creating inside a folder in list view, expand the parent folder
      if (viewMode.value === 'list' && parentId && !expandedFolders.value.has(parentId)) {
        expandedFolders.value.add(parentId)
      }

      // Make the new folder editable after a short delay to ensure it's rendered
      await nextTick()
      setTimeout(() => {
        editingItemId.value = tempId
      }, 100)

      try {
        // Call server to create folder
        const serverFolder = await apiService.createFolder({
          name: folderName,
          parentId: parentId,
          projectId: selectedProject.value?.id,
          orderIndex: newFolder.orderIndex
        })

        // Update the temporary ID with the server-assigned ID
        const folderIndex = fileSystem.value.findIndex(f => f.id === tempId)
        if (folderIndex !== -1) {
          fileSystem.value[folderIndex].id = serverFolder.id
          // Update editing item ID if still editing
          if (editingItemId.value === tempId) {
            editingItemId.value = serverFolder.id
          }
        }

        return serverFolder
      } catch (error) {
        // Rollback on error
        console.error('Failed to create folder on server:', error)
        const index = fileSystem.value.findIndex(f => f.id === tempId)
        if (index !== -1) {
          fileSystem.value.splice(index, 1)
        }
        alert('Failed to create folder. Please try again.')
        return null
      }
    }

    const handleRename = async ({ itemId, oldName, newName, itemType }) => {
      const item = fileSystem.value.find(i => i.id === itemId)
      if (item) {
        // If the new name is empty and it's a new folder, delete it
        if (!newName.trim() && (oldName.startsWith('Untitled Folder') || oldName.startsWith('New Folder'))) {
          const index = fileSystem.value.findIndex(i => i.id === itemId)
          if (index !== -1) {
            fileSystem.value.splice(index, 1)
            console.log(`Deleted empty new folder`)

            // If it was created on server, delete it
            if (!itemId.startsWith('folder_')) {
              try {
                await apiService.deleteFolder(itemId)
              } catch (error) {
                console.error('Failed to delete folder on server:', error)
              }
            }
          }
        } else if (newName.trim()) {
          const trimmedName = newName.trim()

          // Optimistic update
          const previousName = item.name
          item.name = trimmedName

          // If it's a video with a jobId, update metadata
          if (itemType === 'video' && item.jobId) {
            metadataStore.updateVideoName(item.jobId, trimmedName)
          }

          console.log(`Renamed ${itemType} from "${oldName}" to "${trimmedName}"`)

          try {
            // Call server to update name
            if (itemType === 'folder') {
              await apiService.updateFolder(itemId, { name: trimmedName })
            } else if (itemType === 'video') {
              await apiService.updateVideo(itemId, { name: trimmedName })
            }
          } catch (error) {
            // Rollback on error
            console.error(`Failed to rename ${itemType} on server:`, error)
            item.name = previousName
            if (itemType === 'video' && item.jobId) {
              metadataStore.updateVideoName(item.jobId, previousName)
            }
            // Don't show alert since we're mocking
            // alert(`Failed to rename ${itemType}. Please try again.`)
          }
        }
        // Clear editing state
        editingItemId.value = null
      }
    }

    const handleGalleryRename = (renameData) => {
      handleRename(renameData)
    }

    const handleListItemContextMenu = ({ event, item }) => {
      // Use the same context menu handler as gallery view
      handleItemContextMenu(event, item)
    }


    const handleDelete = async (itemId, itemName, itemType) => {
      // Confirm deletion
      const confirmMessage = itemType === 'folder'
        ? `Delete folder "${itemName}"?`
        : `Delete video "${itemName}"?`

      if (confirm(confirmMessage)) {
        // Find the item index
        const index = fileSystem.value.findIndex(i => i.id === itemId)
        if (index !== -1) {
          // Store the item for potential rollback
          const deletedItem = { ...fileSystem.value[index] }

          // If it's a video that's encoding, cancel the job first
          if (deletedItem.type === 'video' && deletedItem.jobId && (deletedItem.status === 'processing' || deletedItem.status === 'queued')) {
            await handleCancelEncoding(deletedItem.jobId)
          }

          // Remove metadata if it's a video
          if (deletedItem.type === 'video' && deletedItem.jobId) {
            metadataStore.removeMetadata(deletedItem.jobId)
          }

          // Optimistically remove from UI
          fileSystem.value.splice(index, 1)
          console.log(`Deleted ${itemType}: "${itemName}"`)

          try {
            // Make server call based on item type
            if (itemType === 'folder') {
              await apiService.deleteFolder(itemId)
            } else if (itemType === 'video') {
              await apiService.deleteVideo(itemId)
            }
          } catch (error) {
            console.error(`Failed to delete ${itemType} on server:`, error)

            // Rollback - restore the item
            fileSystem.value.splice(index, 0, deletedItem)

            // Restore metadata if it's a video
            if (deletedItem.type === 'video' && deletedItem.jobId) {
              metadataStore.initializeMetadata(deletedItem.jobId, {
                name: deletedItem.name,
                projectId: deletedItem.projectId,
                filePath: deletedItem.filePath
              })
            }

            // Show error to user
            alert(`Failed to delete ${itemType}. Please try again.`)
          }
        }
      }
    }

    // Set up menu action listener
    onMounted(() => {
      unsubscribeMenu = window.api.menu.onAction(handleMenuAction)

      // Listen for actions from application menu
      window.electron?.ipcRenderer?.on('menu:action', (event, action, data) => {
        handleMenuAction(action, data)
      })

      // Listen for view mode request from menu
      const respondToViewModeRequest = () => {
        console.log('[ProjectExplorer] Responding to view mode request with:', viewMode.value)
        if (window.api?.menu?.updateViewMode) {
          window.api.menu.updateViewMode(viewMode.value)
        } else if (window.electron?.ipcRenderer) {
          window.electron.ipcRenderer.send('menu:updateViewMode', viewMode.value)
        }
      }

      window.electron?.ipcRenderer?.on('menu:getViewMode', respondToViewModeRequest)

      // Also send the initial view mode immediately
      setTimeout(() => {
        console.log('[ProjectExplorer] Sending initial view mode:', viewMode.value)
        respondToViewModeRequest()
      }, 0)
    })

    const getFolderSize = (folderId) => {
      const calculateSize = (id) => {
        const items = fileSystem.value.filter(item => item.parentId === id)
        let totalBytes = 0

        items.forEach(item => {
          if (item.type === 'video' && item.size) {
            // Parse size string (e.g., "100 MB" -> bytes)
            const match = item.size.match(/^([\d.]+)\s*(MB|GB|KB)?$/i)
            if (match) {
              const value = parseFloat(match[1])
              const unit = match[2]?.toUpperCase() || 'B'
              const multipliers = {
                'GB': 1024 * 1024 * 1024,
                'MB': 1024 * 1024,
                'KB': 1024,
                'B': 1
              }
              totalBytes += value * (multipliers[unit] || 1)
            }
          } else if (item.type === 'folder') {
            // Recursively calculate subfolder size
            totalBytes += parseFloat(calculateSize(item.id)) || 0
          }
        })

        return totalBytes
      }

      const bytes = calculateSize(folderId)

      // Format bytes to human readable
      if (bytes === 0) return '-'
      if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
      } else if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      } else if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
      } else {
        return `${bytes} B`
      }
    }

    // Store thumbnail data URLs
    const thumbnailCache = ref(new Map())

    const getVideoThumbnail = (item) => {
      // Check cache first
      const cacheKey = item.id
      if (thumbnailCache.value.has(cacheKey)) {
        const cached = thumbnailCache.value.get(cacheKey)
        return cached
      }

      // Check if the item has a thumbnail path stored
      if (item.thumbnailPath) {
        // Load the thumbnail asynchronously
        window.api.file.readImage(item.thumbnailPath).then(dataUrl => {
          if (dataUrl) {
            thumbnailCache.value.set(cacheKey, dataUrl)
            // Force reactivity update
            thumbnailCache.value = new Map(thumbnailCache.value)
          }
        }).catch(err => {
          console.error(`[getVideoThumbnail] Error loading thumbnail for ${item.name}:`, err)
        })
        return null // Return null while loading
      }

      // For actively encoding videos, check if job has a thumbnail
      if (item.jobId && (item.status === 'processing' || item.status === 'queued')) {
        const job = videoEncodingStore.jobs.get(item.jobId)
        if (job && job.thumbnailPath) {
          window.api.file.readImage(job.thumbnailPath).then(dataUrl => {
            if (dataUrl) {
              thumbnailCache.value.set(cacheKey, dataUrl)
              // Update the item's thumbnailPath for future reference
              item.thumbnailPath = job.thumbnailPath
              // Force reactivity update
              thumbnailCache.value = new Map(thumbnailCache.value)
            }
          }).catch(err => {
            console.error(`[getVideoThumbnail] Error loading thumbnail from job for ${item.name}:`, err)
          })
          return null // Return null while loading
        }
      }

      return null
    }

    // Create a computed function that returns thumbnail
    const getThumbnailForItem = (item) => {
      // Trigger reactivity on thumbnailCache changes
      thumbnailCache.value.size // Access size to trigger reactivity
      return getVideoThumbnail(item)
    }

    // Register keybindings
    useKeybindings({
      'file:new-folder': createNewFolder,
      'explorer:view-list': () => settingsStore.updateUISettings({ viewMode: 'list' }),
      'explorer:view-gallery': () => settingsStore.updateUISettings({ viewMode: 'gallery' }),
      'edit:delete': () => {
        // Delete selected items
        if (selectedItems.value.size > 0) {
          const firstSelectedId = Array.from(selectedItems.value)[0]
          const item = fileSystem.value.find(i => i.id === firstSelectedId)
          if (item) {
            deleteItem(firstSelectedId, item.type)
          }
        }
      },
      'edit:select-all': () => {
        // Select all items in current view
        if (viewMode.value === 'list') {
          rootItems.value.forEach(item => selectedItems.value.add(item.id))
        } else {
          rootItems.value.forEach(item => selectedItems.value.add(item.id))
        }
      }
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
      handleRootClick,
      viewMode,
      handleRename,
      handleDelete,
      editingItemId,
      currentFolderId,
      navigationPath,
      currentFolderName,
      navigateToFolder,
      showBreadcrumbMenu,
      handleVideoClick,
      handleItemContextMenu,
      handleGalleryRename,
      handleListItemContextMenu,
      getFolderSize,
      emptyStateTitle,
      emptyStateMessage,
      getVideoThumbnail,
      getThumbnailForItem,
      searchPlaceholder
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