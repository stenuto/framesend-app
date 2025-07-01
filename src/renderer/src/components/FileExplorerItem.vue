<template>
  <div class="file-explorer-item" :class="{ 'drag-over': isDragOver }">
    <!-- Folder -->
    <div v-if="item.type === 'folder'" class="folder-item flex items-center px-0 select-none relative" :class="[
      config.itemPaddingY,
      config.fontSize,
      {
        'bg-zinc-400/20': isDragOver && dropIndicatorPosition === 'inside',
        'hover:bg-zinc-800': !isDragOver,
        'opacity-50': isDragging,
        'border-t-2 border-zinc-500': dropIndicatorPosition === 'before',
        'border-b-2 border-zinc-500': dropIndicatorPosition === 'after'
      }
    ]" draggable="true" @click.stop="handleFolderClick" @dragstart="handleDragStart" @dragend="handleDragEnd"
      @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
      <span :style="{ paddingLeft: `${depth * config.indentSize + config.initialFolderOffset}px` }"
        class="flex items-center relative min-w-0 flex-1">
        <Icon :name="isExpanded ? 'chevron-down' : 'chevron-right'"
          :class="[config.chevronSize, 'mr-1 text-zinc-500 flex-shrink-0']" />
        <span class="truncate" :class="[isExpanded ? 'text-zinc-300' : 'text-zinc-500']">{{ item.name }}</span>
      </span>
      <span v-if="item.videoCount && config.showVideoCount" class="ml-2 mr-2 text-xs text-zinc-500 flex-shrink-0">
        {{ item.videoCount }}
      </span>
    </div>

    <!-- Folder contents with tree line -->
    <div v-if="item.type === 'folder' && isExpanded && item.children" class="relative">
      <!-- Vertical line for this folder's children -->
      <div v-if="depth >= 0" class="absolute top-0 bottom-0 border-l border-zinc-700"
        :style="{ left: `${depth * config.indentSize + config.guideLineOffset}px` }" />
      <FileExplorerItem v-for="child in item.children" :key="child.id" :item="child" :depth="depth + 1"
        :expanded-folders="expandedFolders" :selected-item-id="selectedItemId" :config="config"
        @toggle-folder="$emit('toggle-folder', $event)" @select-video="$emit('select-video', $event)"
        @select-folder="$emit('select-folder', $event)" @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end', $event)" @drop-item="$emit('drop-item', $event)" />
    </div>

    <!-- Video -->
    <div v-else-if="item.type === 'video'" class="video-item flex items-center select-none relative" :class="[
      config.itemPaddingY,
      config.itemPaddingX,
      config.fontSize,
      {
        'bg-zinc-700/30': isSelected,
        'hover:bg-zinc-800': !isSelected,
        'opacity-50': isDragging,
        'border-t-2 border-zinc-500': dropIndicatorPosition === 'before',
        'border-b-2 border-zinc-500': dropIndicatorPosition === 'after'
      }
    ]" draggable="true" @click.stop="$emit('select-video', item)" @dragstart="handleDragStart" @dragend="handleDragEnd"
      @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
      <span :style="{ paddingLeft: `${depth * config.indentSize + config.videoIndentExtra}px` }"
        class="flex items-center relative min-w-0 flex-1">
        <Icon name="video" :class="[config.videoIconSize, 'mr-1.5 text-zinc-400/50 flex-shrink-0']" />
        <span class="text-zinc-300 truncate">{{ item.name }}</span>
      </span>
      <span v-if="item.duration && config.showVideoDuration" class="ml-2 mr-2 text-xs text-zinc-500 flex-shrink-0">
        {{ item.duration }}
      </span>
    </div>
  </div>
</template>

<script>
import Icon from './base/Icon.vue'
import { useFileExplorerStore } from '../stores/fileExplorer'

export default {
  name: 'FileExplorerItem',
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
    selectedItemId: {
      type: String,
      default: null
    },
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['toggle-folder', 'select-video', 'select-folder', 'drag-start', 'drag-end', 'drop-item'],
  data() {
    return {
      isDragging: false,
      isDragOver: false,
      dropIndicatorPosition: null,
      autoExpandTimer: null
    }
  },
  computed: {
    isExpanded() {
      return this.expandedFolders.has(this.item.id)
    },
    isSelected() {
      return this.selectedItemId === this.item.id
    }
  },
  mounted() {
    // Listen for global dragend to ensure indicators are cleared
    document.addEventListener('dragend', this.handleGlobalDragEnd)
  },
  beforeUnmount() {
    this.clearAutoExpandTimer()
    document.removeEventListener('dragend', this.handleGlobalDragEnd)
  },
  methods: {
    handleFolderClick() {
      this.$emit('toggle-folder', this.item.id)
    },
    handleDragStart(event) {
      this.isDragging = true

      // Store drag data
      const dragData = {
        type: this.item.type,
        id: this.item.id,
        item: this.item,
        parentId: this.item.type === 'video' ? this.item.folderId : this.item.parentId
      }

      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/json', JSON.stringify(dragData))

      // Create a custom drag image
      const dragImage = document.createElement('div')
      dragImage.className = 'drag-image'
      dragImage.textContent = this.item.name || this.item.title
      dragImage.style.cssText = `
        position: absolute;
        top: -1000px;
        padding: 0px 4px;
        background: oklch(21% 0.006 285.885);
        color: white;
        border-radius: 2px;
        font-size: 13px;
        pointer-events: none;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, 0, 0)

      // Remove the drag image after a delay
      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 0)

      // Emit to parent to track global drag state
      this.$emit('drag-start', dragData)
    },
    handleDragEnd() {
      this.isDragging = false
      this.dropIndicatorPosition = null
      this.$emit('drag-end')
    },
    handleGlobalDragEnd() {
      // Clear any lingering drop indicators when drag ends globally
      this.dropIndicatorPosition = null
      this.isDragOver = false
      this.clearAutoExpandTimer()
    },
    handleDragOver(event) {
      event.preventDefault()
      event.stopPropagation()

      // Use the global drag data instead of trying to get it from dataTransfer
      const dragData = window.__draggedItem
      if (!dragData) return

      // Prevent dropping a folder into itself or its descendants
      if (dragData.type === 'folder' && this.item.type === 'folder') {
        // Check if target folder is the same as or descendant of dragged folder
        if (this.item.id === dragData.item.id || this.isDescendantOf(this.item, dragData.item.id)) {
          event.dataTransfer.dropEffect = 'none'
          return
        }
      }

      event.dataTransfer.dropEffect = 'move'

      // Calculate drop position
      const rect = event.currentTarget.getBoundingClientRect()
      const y = event.clientY - rect.top
      const height = rect.height
      const threshold = height * 0.25

      if (this.item.type === 'folder') {
        // For folders, support before, after, and inside drop zones
        if (y < threshold) {
          this.dropIndicatorPosition = 'before'
          // Clear any auto-expand timer when hovering before
          this.clearAutoExpandTimer()
        } else if (y > height - threshold) {
          this.dropIndicatorPosition = 'after'
          // Clear any auto-expand timer when hovering after
          this.clearAutoExpandTimer()
        } else {
          this.dropIndicatorPosition = 'inside'
          // Start auto-expand timer if folder is closed
          if (!this.isExpanded && !this.autoExpandTimer) {
            this.autoExpandTimer = setTimeout(() => {
              const fileExplorerStore = useFileExplorerStore()
              fileExplorerStore.expandFolder(this.item.id)
              this.autoExpandTimer = null
            }, 800)
          }
        }
      } else {
        // For videos, only support before and after
        if (y < height / 2) {
          this.dropIndicatorPosition = 'before'
        } else {
          this.dropIndicatorPosition = 'after'
        }
      }

      this.isDragOver = true
    },
    handleDragLeave(event) {
      // Only clear if we're actually leaving the element
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.isDragOver = false
        this.dropIndicatorPosition = null
        this.clearAutoExpandTimer()
      }
    },
    handleDrop(event) {
      event.preventDefault()
      event.stopPropagation()

      // Use the global drag data
      const dragData = window.__draggedItem
      if (!dragData) return


      // Prevent dropping a folder into itself or its descendants
      if (dragData.type === 'folder' && this.item.type === 'folder') {
        if (this.item.id === dragData.item.id || this.isDescendantOf(this.item, dragData.item.id)) {
          return
        }
      }

      // Emit drop event with position info
      this.$emit('drop-item', {
        draggedItem: dragData,
        targetItem: this.item,
        position: this.dropIndicatorPosition,
        depth: this.depth
      })

      this.isDragOver = false
      this.dropIndicatorPosition = null
      this.clearAutoExpandTimer()
    },
    getDragData(event) {
      try {
        const data = event.dataTransfer.getData('application/json')
        return data ? JSON.parse(data) : null
      } catch {
        return null
      }
    },
    isDescendantOf(targetFolder, draggedFolderId) {
      // Check if the dragged folder exists in the target folder's tree
      // This prevents dropping a parent into its own child

      const findInTree = (item) => {
        if (item.id === draggedFolderId) return true

        if (item.children && item.children.length > 0) {
          for (const child of item.children) {
            if (findInTree(child)) return true
          }
        }

        return false
      }

      // Check if the dragged folder is found in the target's children
      return targetFolder.children ? targetFolder.children.some(child => findInTree(child)) : false
    },
    clearAutoExpandTimer() {
      if (this.autoExpandTimer) {
        clearTimeout(this.autoExpandTimer)
        this.autoExpandTimer = null
      }
    }
  }
}
</script>

<style scoped>
/* Tree guide styling */
.file-explorer-item {
  position: relative;
}

/* Make guide lines more subtle in light mode, more visible in dark */
.border-zinc-200 {
  opacity: 0.3;
}

.dark .border-zinc-600 {
  opacity: 0.4;
}

/* Ensure chevron doesn't rotate, just changes */
.transition-transform {
  transition: none;
}

/* Drag and drop visual feedback */
.drag-over {
  position: relative;
}

/* Drop indicators */
.border-t-2 {
  border-top-width: 2px;
}

.border-b-2 {
  border-bottom-width: 2px;
}

/* Ring effect for folder drop */
.ring-2 {
  box-shadow: inset 0 0 0 2px currentColor;
}

/* Smooth transitions for drop indicators */
.folder-item,
.video-item {
  transition: opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.15s ease;
}

/* Prevent text selection during drag */
.file-explorer-item {
  user-select: none;
  -webkit-user-select: none;
}
</style>