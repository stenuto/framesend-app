<template>
  <div class="file-explorer-item">
    <!-- Folder -->
    <div 
      v-if="item.type === 'folder'"
      class="folder-item flex items-center py-0.5 px-1 cursor-pointer text-sm select-none relative"
      :class="{
        'bg-blue-500/20 dark:bg-blue-500/20': isSelected,
        'hover:bg-zinc-100 dark:hover:bg-zinc-800': !isSelected
      }"
      @click.stop="handleFolderClick"
    >
      <span :style="{ paddingLeft: `${depth * 20 + 8}px` }" class="flex items-center relative">
        <Icon 
          :name="isExpanded ? 'chevron-down' : 'chevron-right'" 
          class="size-3 mr-1 transition-transform duration-200 text-zinc-600 dark:text-zinc-300"
        />
        <span class="text-zinc-700 dark:text-zinc-300">{{ item.name }}</span>
        <span v-if="item.videoCount" class="ml-auto mr-2 text-xs text-zinc-500 dark:text-zinc-500">
          {{ item.videoCount }}
        </span>
      </span>
    </div>

    <!-- Folder contents with tree line -->
    <div v-if="item.type === 'folder' && isExpanded && item.children" class="relative">
      <!-- Vertical line for this folder's children -->
      <div 
        v-if="depth >= 0"
        class="absolute top-0 bottom-0 border-l border-zinc-200 dark:border-zinc-600"
        :style="{ left: `${depth * 20 + 16}px` }"
      />
      <FileExplorerItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :depth="depth + 1"
        :expanded-folders="expandedFolders"
        :selected-item-id="selectedItemId"
        @toggle-folder="$emit('toggle-folder', $event)"
        @select-video="$emit('select-video', $event)"
        @select-folder="$emit('select-folder', $event)"
      />
    </div>

    <!-- Video -->
    <div 
      v-else-if="item.type === 'video'"
      class="video-item flex items-center py-0.5 px-1 cursor-pointer text-sm select-none relative"
      :class="{
        'bg-blue-500/20 dark:bg-blue-500/20': isSelected,
        'hover:bg-zinc-100 dark:hover:bg-zinc-800': !isSelected
      }"
      @click.stop="$emit('select-video', item)"
    >
      <!-- Vertical line for video items -->
      <div 
        v-if="depth > 0"
        class="absolute top-0 h-full border-l border-zinc-200 dark:border-zinc-600"
        :style="{ left: `${depth * 20 + 16}px` }"
      />
      <span :style="{ paddingLeft: `${depth * 20 + 20}px` }" class="flex items-center relative">
        <Icon name="video" class="size-3.5 mr-1.5 text-zinc-500 dark:text-zinc-400" />
        <span class="text-zinc-600 dark:text-zinc-300 truncate">{{ item.name }}</span>
        <span v-if="item.duration" class="ml-auto mr-2 text-xs text-zinc-400 dark:text-zinc-500">
          {{ item.duration }}
        </span>
      </span>
    </div>
  </div>
</template>

<script>
import Icon from './base/Icon.vue'

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
  methods: {
    handleFolderClick() {
      this.$emit('toggle-folder', this.item.id)
      this.$emit('select-folder', this.item)
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
</style>