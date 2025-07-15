<template>
  <div>
    <!-- Folder Row -->
    <div v-if="item.type === 'folder'" class="group hover:bg-white/4 relative" :class="{
      'bg-indigo-400/10': dragOverFolder === item.id,
      'bg-white/2': isInLastExpandedFolder
    }">
      <!-- Vertical hierarchy lines (outside padding) -->
      <div v-for="i in depth" :key="i" :class="hierarchyLineConfig.lineClasses"
        :style="hierarchyLineConfig.getLineStyle(i)">
      </div>

      <!-- Content with padding -->
      <div class="flex items-center px-3 py-2 cursor-pointer relative" :draggable="true"
        @click="$emit('toggle-folder', item.id)" @dragstart="handleDragStart" @dragend="handleDragEnd"
        @drop.prevent="handleDrop" @dragover.prevent="handleDragOver" @dragleave="handleDragLeave">
        <!-- Name column -->
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <div :style="{ marginLeft: `${depth * 1.5}rem` }" class="flex items-center gap-2">
            <Icon :name="isExpanded ? 'chevron-down' : 'chevron-right'" class="size-3.5 text-zinc-600 flex-shrink-0"
              stroke-width="2" />
            <Icon v-if="!isExpanded" name="folder" class="size-3.5 text-zinc-600 flex-shrink-0" />
            <Icon v-else name="folder-open" class="size-3.5 text-zinc-600 flex-shrink-0" />
            <span class="text-sm text-zinc-200 truncate">{{ item.name }}</span>
          </div>
        </div>

        <!-- Files column -->
        <div class="w-24 text-sm text-zinc-400">
          {{ totalFileCount }}
        </div>

        <!-- Size column -->
        <div class="w-28 text-sm text-zinc-400">
          {{ folderSize }}
        </div>

        <!-- Status column -->
        <div class="w-24">
          <!-- <span class="text-sm text-zinc-500">
            {{ totalFileCount }} {{ totalFileCount === 1 ? 'video' : 'videos' }}
          </span> -->
        </div>
      </div>
    </div>

    <!-- Video Row -->
    <div v-else-if="item.type === 'video'" class="group hover:bg-white/4 relative" :class="{
      'bg-zinc-800/35': isInLastExpandedFolder
    }">
      <!-- Vertical hierarchy lines (outside padding) -->
      <div v-for="i in depth" :key="i" :class="hierarchyLineConfig.lineClasses"
        :style="hierarchyLineConfig.getLineStyle(i)">
      </div>

      <!-- Content with padding -->
      <div class="flex items-center px-3 py-2 cursor-move relative" :draggable="true" @dragstart="handleDragStart"
        @dragend="handleDragEnd" @contextmenu.prevent="handleContextMenu">
        <!-- Name column -->
        <div class="flex-1 flex items-center gap-2 min-w-0">
          <div :style="{ marginLeft: `${depth * 1.5}rem` }" class="flex items-center gap-2">
            <Icon name="video" class="size-3.5 text-indigo-500 flex-shrink-0" :stroke-width="2" />
            <span class="text-sm text-zinc-200 truncate">{{ item.name }}</span>
          </div>
        </div>

        <!-- Files column (empty for videos) -->
        <div class="w-24  text-sm text-zinc-400">
          -
        </div>

        <!-- Size column -->
        <div class="w-28 text-sm text-zinc-400">
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
            <svg class="size-5 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                class="text-zinc-700/50" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                :stroke-dasharray="`${2 * Math.PI * 10}`"
                :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (item.progress || 0) / 100)}`"
                class="text-indigo-500 duration-500" />
            </svg>
            <span class="text-sm text-zinc-300">
              {{ Math.round(item.progress || 0) }}%
            </span>
          </div>
          <!-- QUEUED -->
          <div v-if="item.status === 'queued'"
            class="size-5 rounded-full bg-amber-800/20 flex items-center justify-center">
            <Icon name="clock-fading" class="size-3.5 text-amber-400" :stroke-width="2" />
          </div>
          <div v-if="item.status === 'failed'"
            class="size-5 rounded-full bg-rose-800/20 flex items-center justify-center">
            <Icon name="x" class="size-3.5 text-rose-400" :stroke-width="2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Unknown type warning -->
    <div v-else class="group">
      <div class="flex items-center px-6 py-3 bg-red-900/20">
        <div class="flex-1 flex items-center gap-2">
          <Icon name="exclamation-triangle" class="w-4 h-4 text-red-500" />
          <span class="text-sm text-red-400">Unknown item type: {{ item.type }} ({{ item.name }})</span>
        </div>
        <div class="w-24"></div>
        <div class="w-28"></div>
        <div class="w-24"></div>
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
import Icon from '@components/base/Icon.vue'

export default {
  name: 'FileSystemItem',
  components: {
    Icon
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
    const isExpanded = computed(() =>
      props.expandedFolders.has(props.item.id)
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
        borderStyle: 'border-l',           // 'border-l' for solid, 'border-l-2' for thicker, 'border-l border-dashed' for dashed
        borderColor: 'border-white/10', // Color and opacity

        // Positioning
        indentSize: 1.5,                   // rem - how much to indent per level
        lineOffset: 1.15,                   // rem - offset from left edge for first line
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
          // Parse size string (e.g., "450 MB" -> 450 * 1024 * 1024)
          const match = item.size.match(/^([\d.]+)\s*(MB|GB|KB)?$/i)
          if (match) {
            const value = parseFloat(match[1])
            const unit = match[2]?.toUpperCase() || 'B'

            switch (unit) {
              case 'GB':
                totalBytes += value * 1024 * 1024 * 1024
                break
              case 'MB':
                totalBytes += value * 1024 * 1024
                break
              case 'KB':
                totalBytes += value * 1024
                break
              default:
                totalBytes += value
            }
          }
        } else if (item.type === 'folder') {
          const subFolderSize = calculateFolderSize(item.id)
          const match = subFolderSize.match(/^([\d.]+)\s*(MB|GB|KB)?$/i)
          if (match) {
            const value = parseFloat(match[1])
            const unit = match[2]?.toUpperCase() || 'B'

            switch (unit) {
              case 'GB':
                totalBytes += value * 1024 * 1024 * 1024
                break
              case 'MB':
                totalBytes += value * 1024 * 1024
                break
              case 'KB':
                totalBytes += value * 1024
                break
              default:
                totalBytes += value
            }
          }
        }
      })

      // Convert bytes to human readable format
      if (totalBytes === 0) return '-'
      if (totalBytes >= 1024 * 1024 * 1024) {
        return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
      } else if (totalBytes >= 1024 * 1024) {
        return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      } else if (totalBytes >= 1024) {
        return `${(totalBytes / 1024).toFixed(1)} KB`
      } else {
        return `${totalBytes} B`
      }
    }

    const handleDragStart = (e) => {
      emit('drag-start', { event: e, item: props.item })
    }

    const handleDragEnd = (e) => {
      emit('drag-end', e)
    }

    const handleDrop = (e) => {
      // Check if this is an external file drop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        emit('external-drop', { files: e.dataTransfer.files, folderId: props.item.id })
        e.preventDefault()
        e.stopPropagation()
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

    return {
      isExpanded,
      children,
      videoCount,
      totalFileCount,
      folderSize,
      hierarchyLineConfig,
      isInLastExpandedFolder,
      handleDragStart,
      handleDragEnd,
      handleDrop,
      handleDragOver,
      handleDragLeave,
      handleContextMenu
    }
  }
}
</script>