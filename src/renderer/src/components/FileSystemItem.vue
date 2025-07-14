<template>
  <div>
    <!-- Folder -->
    <template v-if="item.type === 'folder'">
      <div 
        class="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-zinc-800/50 cursor-pointer transition-all"
        :style="{ marginLeft: `${depth * 1.5}rem` }"
        :draggable="true"
        @click="$emit('toggle-folder', item.id)"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
        @drop.prevent="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        :class="{ 'bg-cyan-500/20 border border-cyan-500': dragOverFolder === item.id }"
      >
        <Icon 
          :name="isExpanded ? 'chevron-down' : 'chevron-right'" 
          class="w-4 h-4 text-zinc-500"
        />
        <Icon name="folder" class="w-4 h-4 text-zinc-400" />
        <span class="text-sm text-zinc-200">{{ item.name }}</span>
        <span class="ml-auto text-xs text-zinc-500">
          {{ videoCount }} videos
        </span>
      </div>

      <!-- Recursive children -->
      <template v-if="isExpanded">
        <FileSystemItem
          v-for="child in children"
          :key="child.id"
          :item="child"
          :depth="depth + 1"
          :expanded-folders="expandedFolders"
          :drag-over-folder="dragOverFolder"
          :get-folder-items="getFolderItems"
          :get-folder-video-count="getFolderVideoCount"
          @toggle-folder="$emit('toggle-folder', $event)"
          @drag-start="$emit('drag-start', $event)"
          @drag-end="$emit('drag-end', $event)"
          @drop="$emit('drop', $event)"
          @drag-over="$emit('drag-over', $event)"
          @drag-leave="$emit('drag-leave', $event)"
        />
      </template>
    </template>

    <!-- Video -->
    <template v-else-if="item.type === 'video'">
      <div 
        class="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-zinc-800/50 cursor-move"
        :style="{ marginLeft: `${depth * 1.5}rem` }"
        :draggable="true"
        @dragstart="handleDragStart"
        @dragend="handleDragEnd"
      >
        <Icon name="film" class="w-4 h-4 text-zinc-500" />
        <span class="text-sm text-zinc-200 truncate">{{ item.name }}</span>
        <span class="ml-auto text-xs text-zinc-500">{{ item.duration }}</span>
      </div>
    </template>

    <!-- Unknown type warning -->
    <template v-else>
      <div 
        class="flex items-center gap-2 px-3 py-1.5 rounded bg-red-900/20 border border-red-500"
        :style="{ marginLeft: `${depth * 1.5}rem` }"
      >
        <Icon name="exclamation-triangle" class="w-4 h-4 text-red-500" />
        <span class="text-sm text-red-400">Unknown item type: {{ item.type }} ({{ item.name }})</span>
      </div>
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
    }
  },
  emits: ['toggle-folder', 'drag-start', 'drag-end', 'drop', 'drag-over', 'drag-leave'],
  setup(props, { emit }) {
    const isExpanded = computed(() => 
      props.expandedFolders.has(props.item.id)
    )

    const children = computed(() => 
      props.item.type === 'folder' ? props.getFolderItems(props.item.id) : []
    )

    const videoCount = computed(() => 
      props.item.type === 'folder' ? props.getFolderVideoCount(props.item.id) : 0
    )

    const handleDragStart = (e) => {
      emit('drag-start', { event: e, item: props.item })
    }

    const handleDragEnd = (e) => {
      emit('drag-end', e)
    }

    const handleDrop = (e) => {
      emit('drop', { event: e, folderId: props.item.id })
    }

    const handleDragOver = (e) => {
      emit('drag-over', { event: e, folderId: props.item.id })
    }

    const handleDragLeave = (e) => {
      emit('drag-leave', { event: e, folderId: props.item.id })
    }

    return {
      isExpanded,
      children,
      videoCount,
      handleDragStart,
      handleDragEnd,
      handleDrop,
      handleDragOver,
      handleDragLeave
    }
  }
}
</script>