<template>
  <div class="text-[13px]">
    <!-- Folder Row -->
    <div v-if="item.type === 'folder'" class="group dark:hover:bg-white/4 hover:bg-black/5 relative" :class="{
      'bg-indigo-400/10': dragOverFolder === item.id,
      'dark:bg-white/2 bg-black/3': isInLastExpandedFolder,
    }">
      <!-- Vertical hierarchy lines (outside padding) -->
      <div v-for="i in depth" :key="i" :class="hierarchyLineConfig.lineClasses"
        :style="hierarchyLineConfig.getLineStyle(i)">
      </div>

      <!-- Content with padding -->
      <div class="flex items-center px-2.5 py-1 relative " :draggable="true" @click="$emit('toggle-folder', item.id)"
        @dragstart="handleDragStart" @dragend="handleDragEnd" @drop="handleDrop" @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave">
        <!-- Name column -->
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <div :style="{ marginLeft: `${depth * 1}rem` }" class="flex items-center gap-1.5">
            <Icon :name="isExpanded ? 'chevron-down' : 'chevron-right'" class="size-3 flex-shrink-0" stroke-width="2" />
            <div class="size-3 flex-shrink-0 relative dark:text-current/50 text-current/75">
              <Icon v-if="!isExpanded" name="folder" class="size-3" />
              <Icon v-else name="folder-open" class="size-3" />
            </div>
            <span class="truncate">{{ item.name }}</span>
          </div>
        </div>

        <!-- Files column -->
        <div class="w-24 dark:text-current/60 text-current/80">
          {{ totalFileCount }}
        </div>

        <!-- Size column -->
        <div class="w-28 dark:text-current/60 text-current/80">
          {{ folderSize }}
        </div>

        <!-- Status column -->
        <div class="w-24 dark:text-current/60 text-current/80">

        </div>
      </div>
    </div>

    <!-- Video Row -->
    <div v-else-if="item.type === 'video'" class="group dark:hover:bg-white/4 hover:bg-black/4 relative" :class="{
      'dark:bg-white/2 bg-black/3': isInLastExpandedFolder,
    }">
      <!-- Vertical hierarchy lines (outside padding) -->
      <div v-for="i in depth" :key="i" :class="hierarchyLineConfig.lineClasses"
        :style="hierarchyLineConfig.getLineStyle(i)">
      </div>

      <!-- Content with padding -->
      <div class="flex items-center pr-3 py-1 relative cursor-pointer" :class="[depth === 0 ? 'pl-[10px]' : 'pl-3']" :draggable="true"
        @click="handleVideoClick"
        @dragstart="handleDragStart" @dragend="handleDragEnd" @contextmenu.prevent="handleContextMenu">
        <!-- Name column -->
        <div class="flex-1 flex items-center gap-2 min-w-0"
          :class="{ 'opacity-60 dark:opacity-40': item.status === 'processing' || item.status === 'queued' }">
          <div :style="{ marginLeft: `${depth * 1}rem` }" class="flex items-center gap-1.5">
            <Icon name="video" class="size-3.5 text-indigo-500 flex-shrink-0"
              :class="{ 'animate-pulse': item.status === 'processing' }" :stroke-width="2" />
            <span class=" truncate">{{ item.name }}</span>
          </div>
        </div>

        <!-- Files column (empty for videos) -->
        <div class="w-24 dark:text-current/60 text-current/80" :class="{ 'opacity-50': item.status === 'processing' }">
          -
        </div>

        <!-- Size column -->
        <div class="w-28 dark:text-current/60 text-current/80" :class="{ 'opacity-50': item.status === 'processing' }">
          {{ item.size || '-' }}
        </div>

        <!-- Status column -->
        <div class="w-24 flex items-center">
          <div v-if="item.status === 'ready'"
            class="size-5 rounded-full dark:bg-emerald-800/20 bg-emerald-100 flex items-center justify-center">
            <Icon name="check" class="size-3.5 dark:text-emerald-600 text-emerald-500" />
          </div>
          <!-- PROCESSING -->
          <div v-else-if="item.status === 'processing'" class="inline-flex items-center gap-1.5">
            <svg class="size-5 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                class="text-current/15" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                :stroke-dasharray="`${2 * Math.PI * 10}`"
                :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (item.progress || 0) / 100)}`"
                class="dark:text-indigo-500 text-indigo-500 duration-500" />
            </svg>
            <span class="text-xs font-medium">
              {{ Math.round(item.progress || 0) }}%
            </span>
          </div>
          <!-- QUEUED -->
          <div v-if="item.status === 'queued'"
            class="size-5 rounded-full dark:bg-amber-800/20 bg-amber-100 flex items-center justify-center">
            <Icon name="clock-fading" class="size-3.5 dark:text-amber-400 text-amber-500" :stroke-width="2" />
          </div>
          <!-- FAILED -->
          <div v-if="item.status === 'failed'"
            class="size-5 rounded-full dark:bg-rose-800/20 bg-rose-100 flex items-center justify-center">
            <Icon name="x" class="size-3.5 dark:text-rose-400 text-rose-500" :stroke-width="2" />
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
        @toggle-folder="$emit('toggle-folder', $event)" @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end', $event)" @drop="$emit('drop', $event)" @drag-over="$emit('drag-over', $event)"
        @drag-leave="$emit('drag-leave', $event)" @external-drop="$emit('external-drop', $event)"
        @cancel-encoding="$emit('cancel-encoding', $event)" />
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'
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
    }
  },
  emits: ['toggle-folder', 'drag-start', 'drag-end', 'drop', 'drag-over', 'drag-leave', 'external-drop', 'cancel-encoding'],
  setup(props, { emit }) {
    const uiStore = useUIStore()
    
    const isExpanded = computed(() =>
      props.expandedFolders.has(props.item.id)
    )

    // Base classes for row containers
    const rowBaseClasses = computed(() =>
      'group dark:hover:bg-white/4 hover:bg-black/6 relative'
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
        borderColor: 'dark:border-white/8 border-black/8', // Color and opacity

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

    const handleContextMenu = (e) => {
      if (props.item.type === 'video' && (props.item.status === 'processing' || props.item.status === 'queued') && props.item.jobId) {
        // Show native context menu for cancelling encoding
        const action = props.item.status === 'processing' ? 'processing' : 'queued encoding'
        if (confirm(`Cancel ${action} for this video?`)) {
          emit('cancel-encoding', props.item.jobId)
        }
      }
    }

    const handleVideoClick = () => {
      if (props.item.type === 'video') {
        uiStore.selectVideo(props.item)
      }
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
      INDENT_SIZE
    }
  }
}
</script>