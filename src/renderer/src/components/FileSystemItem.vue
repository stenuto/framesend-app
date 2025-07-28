<template>
  <div class="text-[13px]">
    <!-- Folder Row -->
    <div v-if="item.type === 'folder'" class="group hover:bg-white/4 relative" :class="{
      'bg-blue-400/10': dragOverFolder === item.id,
      'bg-white/2': isInLastExpandedFolder,
    }">
      <!-- Vertical hierarchy lines (outside padding) -->
      <div v-for="i in depth" :key="i" :class="hierarchyLineConfig.lineClasses"
        :style="hierarchyLineConfig.getLineStyle(i)">
      </div>

      <!-- Content with padding -->
      <div class="flex items-center px-2.5 py-1 relative " :draggable="true" @click="!isEditing && $emit('toggle-folder', item.id)"
        @dragstart="handleDragStart" @dragend="handleDragEnd" @drop="handleDrop" @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave" @contextmenu.prevent="handleContextMenu">
        <!-- Name column -->
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <div :style="{ marginLeft: `${depth * 1}rem` }" class="flex items-center gap-0.5">
            <Icon :name="isExpanded ? 'chevron-down' : 'chevron-right'" class="size-3 flex-shrink-0" stroke-width="2" />
            <div class="size-3 flex-shrink-0 relative text-current/50">
              <Icon v-if="!isExpanded" name="folder" class="size-3" />
              <Icon v-else name="folder-open" class="size-3" />
            </div>
            <span :contenteditable="isEditing" @blur="handleNameBlur" @keydown.enter.prevent="handleNameBlur"
              @keydown.esc="cancelEdit" @click="handleNameClick" @mousedown="handleNameMouseDown" @focus="handleNameFocus" ref="nameEditRef"
              class="truncate outline-none px-1.5"
              :class="{ 'bg-zinc-800 rounded': isEditing }">{{ editingName }}</span>
          </div>
        </div>

        <!-- Files column -->
        <div class="w-24 text-current/60">
          {{ totalFileCount }}
        </div>

        <!-- Size column -->
        <div class="w-28 text-current/60">
          {{ folderSize }}
        </div>

        <!-- Status column -->
        <div class="w-24 text-current/60">

        </div>
      </div>
    </div>

    <!-- Video Row -->
    <div v-else-if="item.type === 'video'" class="group hover:bg-white/4 relative" :class="{
      'bg-white/2': isInLastExpandedFolder,
    }">
      <!-- Vertical hierarchy lines (outside padding) -->
      <div v-for="i in depth" :key="i" :class="hierarchyLineConfig.lineClasses"
        :style="hierarchyLineConfig.getLineStyle(i)">
      </div>

      <!-- Content with padding -->
      <div class="flex items-center pr-3 py-1 relative" :class="[depth === 0 ? 'pl-[10px]' : 'pl-3']" :draggable="true"
        @click="handleVideoClick" @dragstart="handleDragStart" @dragend="handleDragEnd"
        @contextmenu.prevent="handleContextMenu">
        <!-- Name column -->
        <div class="flex-1 flex items-center gap-2 min-w-0"
          :class="{ 'opacity-40': item.status === 'processing' || item.status === 'queued' }">
          <div :style="{ marginLeft: `${depth * 1}rem` }" class="flex items-center gap-0.5">
            <Icon name="video" class="size-3.5 text-blue-600 flex-shrink-0"
              :class="{ 'animate-pulse': item.status === 'processing' }" :stroke-width="2" />
            <span :contenteditable="isEditing" @blur="handleNameBlur" @keydown.enter.prevent="handleNameBlur"
              @keydown.esc="cancelEdit" @click="handleNameClick" @mousedown="handleNameMouseDown" @focus="handleNameFocus" ref="nameEditRef"
              class="truncate outline-none px-1.5"
              :class="{ 'bg-zinc-800 rounded': isEditing }">{{ editingName }}</span>
          </div>
        </div>

        <!-- Files column (empty for videos) -->
        <div class="w-24 text-current/60" :class="{ 'opacity-50': item.status === 'processing' }">
          -
        </div>

        <!-- Size column -->
        <div class="w-28 text-current/60" :class="{ 'opacity-50': item.status === 'processing' }">
          {{ item.size || '-' }}
        </div>

        <!-- Status column -->
        <div class="w-24 flex items-center">
          <div v-if="item.status === 'ready'"
            class="size-5 rounded-full bg-emerald-800/20 flex items-center justify-center">
            <Icon name="check" class="size-3.5 text-emerald-600" />
          </div>
          <!-- PROCESSING -->
          <div v-else-if="item.status === 'processing'" class="inline-flex items-center gap-1.5">
            <svg class="size-4 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                class="text-current/15" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                :stroke-dasharray="`${2 * Math.PI * 10}`"
                :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (item.progress || 0) / 100)}`"
                class="text-blue-500 duration-500" />
            </svg>
            <span class="text-xs">
              {{ Math.round(item.progress || 0) }}%
            </span>
          </div>
          <!-- QUEUED -->
          <div v-if="item.status === 'queued'"
            class="rounded-smooth px-1.5 text-[11px] bg-zinc-500/30 group-hover:opacity-100 opacity-30 text-zinc-200/80 flex items-center justify-center">
            Queued
          </div>
          <!-- FAILED -->
          <div v-if="item.status === 'failed'"
            class="rounded-smooth px-1.5 text-[11px] bg-red-900/40 group-hover:opacity-100 opacity-30 text-red-200/80 flex items-center justify-center">
            Failed
          </div>
        </div>
      </div>
    </div>

    <!-- Unknown type warning -->
    <div v-else class="group">
      <div class="flex items-center px-6 py-3 bg-red-900/20">
        <div class="flex-1 flex items-center gap-2">
          <Icon name="exclamation-triangle" class="w-4 h-4 text-red-500" />
          <span class="text-red-400">Unknown item type: {{ item.type }} ({{ item.name }})</span>
        </div>
        <div :class="COLUMN_WIDTHS.files"></div>
        <div :class="COLUMN_WIDTHS.size"></div>
        <div :class="COLUMN_WIDTHS.status"></div>
      </div>
    </div>

    <!-- Recursive children -->
    <template v-if="item.type === 'folder' && isExpanded">
      <FileSystemItem v-for="(child, index) in children" :key="child.id" :item="child" :depth="depth + 1"
        :expanded-folders="expandedFolders" :drag-over-folder="dragOverFolder" :get-folder-items="getFolderItems"
        :get-folder-video-count="getFolderVideoCount" :last-expanded-folder="lastExpandedFolder"
        :get-ancestor-ids="getAncestorIds" :is-last-child="index === children.length - 1"
        :editing-item-id="editingItemId" @set-editing-item="$emit('set-editing-item', $event)"
        @toggle-folder="$emit('toggle-folder', $event)" @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end', $event)" @drop="$emit('drop', $event)" @drag-over="$emit('drag-over', $event)"
        @drag-leave="$emit('drag-leave', $event)" @external-drop="$emit('external-drop', $event)"
        @cancel-encoding="$emit('cancel-encoding', $event)" @rename="$emit('rename', $event)"
        @delete="$emit('delete', $event)" />
    </template>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import Icon from '@components/base/Icon.vue'
import HierarchyLines from './HierarchyLines.vue'

// Constants
const INDENT_SIZE = 1 // rem
const COLUMN_WIDTHS = {
  files: 'w-24',
  size: 'w-28',
  status: 'w-24'
}

// Utility functions
const parseSize = (sizeStr) => {
  if (!sizeStr || sizeStr === '-') return 0

  const match = sizeStr.match(/^([\d.]+)\s*(MB|GB|KB)?$/i)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2]?.toUpperCase() || 'B'

  const multipliers = {
    'GB': 1024 * 1024 * 1024,
    'MB': 1024 * 1024,
    'KB': 1024,
    'B': 1
  }

  return value * (multipliers[unit] || 1)
}

const formatBytes = (bytes) => {
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

export default {
  name: 'FileSystemItem',
  components: {
    Icon,
    HierarchyLines
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    expandedFolders: {
      type: Set,
      required: true
    },
    dragOverFolder: {
      type: String,
      default: null
    },
    getFolderItems: {
      type: Function,
      required: true
    },
    getFolderVideoCount: {
      type: Function,
      required: true
    },
    lastExpandedFolder: {
      type: String,
      default: null
    },
    getAncestorIds: {
      type: Function,
      default: () => () => []
    },
    isLastChild: {
      type: Boolean,
      default: false
    },
    editingItemId: {
      type: String,
      default: null
    }
  },
  emits: ['toggle-folder', 'drag-start', 'drag-end', 'drop', 'drag-over', 'drag-leave', 'external-drop', 'cancel-encoding', 'rename', 'delete', 'set-editing-item'],
  setup(props, { emit }) {
    const uiStore = useUIStore()
    const editingName = ref(props.item.name)
    const nameEditRef = ref(null)

    // Compute if this item is being edited based on editingItemId
    const isEditing = computed(() => props.editingItemId === props.item.id)

    const isExpanded = computed(() =>
      props.expandedFolders.has(props.item.id)
    )

    // Watch for prop changes and update editingName
    watch(() => props.item.name, (newName) => {
      if (!isEditing.value) {
        editingName.value = newName
      }
    })

    // Function to select all text in the editable element
    const selectAllText = () => {
      if (!nameEditRef.value) return
      
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(nameEditRef.value)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    // Function to focus and select text
    const focusAndSelectAll = async () => {
      editingName.value = props.item.name
      await nextTick()
      
      if (nameEditRef.value) {
        // Set the text content directly
        nameEditRef.value.textContent = props.item.name
        
        // Focus and select all
        setTimeout(() => {
          if (nameEditRef.value) {
            nameEditRef.value.focus()
            // Use execCommand for better cross-browser support
            document.execCommand('selectAll', false, null)
          }
        }, 0)
      }
    }

    // Watch for when this item becomes editable
    watch(isEditing, async (newValue, oldValue) => {
      if (newValue && !oldValue) {
        await focusAndSelectAll()
      }
    })

    // Also check on mount in case item is created in editing state
    onMounted(async () => {
      if (isEditing.value) {
        await focusAndSelectAll()
      }
    })

    // Base classes for row containers
    const rowBaseClasses = computed(() =>
      'group hover:bg-white/4 relative'
    )

    // Check if this item should be highlighted
    const isInLastExpandedFolder = computed(() => {
      if (!props.lastExpandedFolder) return false
      // Check if this item is the last expanded folder
      if (props.item.id === props.lastExpandedFolder) {
        return true
      }
      // Check if this item is a descendant of the last expanded folder
      const ancestors = props.getAncestorIds(props.item.id)
      const result = ancestors.includes(props.lastExpandedFolder)
      return result
    })

    // Hierarchy line configuration
    const hierarchyLineConfig = computed(() => {
      const config = {
        // Visual style
        borderStyle: 'border-l -ml-[.5px]',           // 'border-l' for solid, 'border-l-2' for thicker, 'border-l border-dashed' for dashed
        borderColor: 'border-white/8', // Color and opacity

        // Positioning
        indentSize: INDENT_SIZE,           // rem - how much to indent per level
        lineOffset: 1,                  // rem - offset from left edge for first line
      }

      return {
        ...config,
        // Computed values
        getLineStyle(depthLevel) {
          return {
            left: `${(depthLevel - 1) * config.indentSize + config.lineOffset}rem`
          }
        },

        // Classes for the line elements
        lineClasses: `absolute top-0 bottom-0 ${config.borderStyle} ${config.borderColor}`
      }
    })

    const children = computed(() =>
      props.item.type === 'folder' ? props.getFolderItems(props.item.id) : []
    )

    const videoCount = computed(() =>
      props.item.type === 'folder' ? props.getFolderVideoCount(props.item.id) : 0
    )

    const totalFileCount = computed(() => {
      if (props.item.type !== 'folder') return 0
      return countAllItems(props.item.id)
    })

    const countAllItems = (folderId) => {
      const items = props.getFolderItems(folderId)
      let count = 0

      items.forEach(item => {
        if (item.type === 'video') {
          count++
        } else if (item.type === 'folder') {
          count += countAllItems(item.id)
        }
      })

      return count
    }

    const folderSize = computed(() => {
      if (props.item.type !== 'folder') return '-'
      return calculateFolderSize(props.item.id)
    })

    const calculateFolderSize = (folderId) => {
      const items = props.getFolderItems(folderId)
      let totalBytes = 0

      items.forEach(item => {
        if (item.type === 'video' && item.size) {
          totalBytes += parseSize(item.size)
        } else if (item.type === 'folder') {
          const subFolderSize = calculateFolderSize(item.id)
          totalBytes += parseSize(subFolderSize)
        }
      })

      return formatBytes(totalBytes)
    }

    const handleDragStart = (e) => {
      emit('drag-start', { event: e, item: props.item })
    }

    const handleDragEnd = (e) => {
      emit('drag-end', e)
    }

    const handleDrop = (e) => {
      // Only folders should handle drops
      if (props.item.type !== 'folder') return

      // Check if we're dropping on the same item that was dragged
      const draggedData = e.dataTransfer.getData('text/plain')
      if (draggedData) {
        try {
          const draggedItem = JSON.parse(draggedData)
          if (draggedItem.id === props.item.id) {
            // Dropping on self - prevent and stop
            e.preventDefault()
            e.stopPropagation()
            return
          }
        } catch (err) {
          // Invalid JSON, continue with normal drop
        }
      }

      // This is a valid drop on a folder - handle it
      e.preventDefault()
      e.stopPropagation()

      // Check if this is an external file drop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        emit('external-drop', { files: e.dataTransfer.files, folderId: props.item.id })
        return
      }

      emit('drop', { event: e, folderId: props.item.id })
    }

    const handleDragOver = (e) => {
      emit('drag-over', { event: e, folderId: props.item.id })
    }

    const handleDragLeave = (e) => {
      emit('drag-leave', { event: e, folderId: props.item.id })
    }

    // Remove the menu action handler from here - it should only be in the parent

    const handleContextMenu = async (e) => {
      let menuTemplate = []

      if (props.item.type === 'video') {
        menuTemplate = [
          {
            label: 'Share',
            submenu: [
              {
                label: 'Copy Web Link',
                action: 'share:copyWebLink',
                data: { fileId: props.item.id, fileName: props.item.name }
              },
              {
                label: 'Copy iFrame Embed',
                action: 'share:copyIframeEmbed',
                data: { fileId: props.item.id, fileName: props.item.name }
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Rename',
            action: 'file:rename',
            data: { itemId: props.item.id, itemName: props.item.name, itemType: props.item.type }
          },
          {
            label: 'Delete',
            action: 'file:delete',
            data: { itemId: props.item.id, itemName: props.item.name, itemType: props.item.type }
          }
        ]

        // Add cancel option if video is encoding
        if ((props.item.status === 'processing' || props.item.status === 'queued') && props.item.jobId) {
          menuTemplate.unshift({
            label: `Cancel ${props.item.status === 'processing' ? 'Encoding' : 'Queued Job'}`,
            action: 'video:cancelJob',
            data: { jobId: props.item.jobId }
          })
          menuTemplate.splice(1, 0, { type: 'separator' })
        }
      } else if (props.item.type === 'folder') {
        // Check if folder is empty
        const folderItems = props.getFolderItems(props.item.id)
        const isEmpty = folderItems.length === 0

        menuTemplate = [
          {
            label: 'New Folder',
            action: 'folder:newFolder',
            data: { parentId: props.item.id }
          },
          { type: 'separator' },
          {
            label: 'Rename',
            action: 'folder:rename',
            data: { itemId: props.item.id, itemName: props.item.name, itemType: props.item.type }
          },
          {
            label: 'Delete',
            action: 'folder:delete',
            data: { itemId: props.item.id, itemName: props.item.name, itemType: props.item.type },
            enabled: isEmpty // Disable if folder is not empty
          }
        ]
      }

      if (menuTemplate.length > 0) {
        await window.api.menu.showContext(menuTemplate, {
          x: e.clientX,
          y: e.clientY
        })
      }
    }

    // Remove handleMenuAction - it's causing all items to respond

    const handleVideoClick = () => {
      if (props.item.type === 'video') {
        uiStore.selectVideo(props.item)
      }
    }

    // Remove menu action handler registration - it should only be in parent

    // startEditing removed - parent handles this via editingItemId prop

    const handleNameClick = (e) => {
      if (isEditing.value) {
        e.stopPropagation()
        e.preventDefault()
      }
      // When not editing, let the click bubble up to the parent div
    }

    const handleNameMouseDown = (e) => {
      if (isEditing.value) {
        // Only prevent default if clicking would deselect text
        const selection = window.getSelection()
        if (selection.toString() && nameEditRef.value.contains(selection.anchorNode)) {
          e.preventDefault()
        }
      }
    }

    const handleNameFocus = () => {
      if (isEditing.value) {
        // Select all text when focused
        setTimeout(() => {
          selectAllText()
        }, 10)
      }
    }

    const handleNameBlur = () => {
      if (!isEditing.value) return

      const newName = nameEditRef.value.textContent.trim()
      if (newName && newName !== props.item.name) {
        // Emit rename event - parent will update the item
        emit('rename', {
          itemId: props.item.id,
          oldName: props.item.name,
          newName: newName,
          itemType: props.item.type
        })
        editingName.value = newName
      } else {
        // Revert to original name if empty or unchanged
        nameEditRef.value.textContent = props.item.name
        editingName.value = props.item.name
      }

      emit('set-editing-item', null)
    }

    const cancelEdit = () => {
      if (nameEditRef.value) {
        nameEditRef.value.textContent = props.item.name
      }
      editingName.value = props.item.name
      emit('set-editing-item', null)
    }


    return {
      isExpanded,
      children,
      videoCount,
      totalFileCount,
      folderSize,
      hierarchyLineConfig,
      isInLastExpandedFolder,
      rowBaseClasses,
      handleDragStart,
      handleDragEnd,
      handleDrop,
      handleDragOver,
      handleDragLeave,
      handleContextMenu,
      handleVideoClick,
      COLUMN_WIDTHS,
      INDENT_SIZE,
      isEditing,
      editingName,
      nameEditRef,
      handleNameClick,
      handleNameMouseDown,
      handleNameFocus,
      handleNameBlur,
      cancelEdit
    }
  }
}
</script>