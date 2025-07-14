<template>
  <div
    :class="[
      'group flex items-center gap-0.5 h-6 rounded cursor-pointer select-none',
      'hover:bg-zinc-800/50 transition-colors',
      isDragging && 'opacity-50'
    ]"
    :style="{ paddingLeft: `${8 + depth * 12}px` }"
    draggable="true"
    @click="$emit('toggle')"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @drop.prevent="$emit('drop', $event)"
    @dragleave="$emit('dragleave', $event)"
  >
    <Icon 
      :name="isExpanded ? 'chevron-down' : 'chevron-right'" 
      class="w-3 h-3 text-zinc-500 flex-shrink-0"
    />
    <Icon 
      name="folder" 
      class="w-3.5 h-3.5 text-zinc-400 flex-shrink-0"
    />
    <span class="text-[13px] text-zinc-300 truncate flex-1">{{ folder.name }}</span>
    <span class="text-[11px] text-zinc-500 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {{ fileCount }}
    </span>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Icon from '@components/base/Icon.vue'

export default defineComponent({
  name: 'FolderItem',
  components: {
    Icon
  },
  props: {
    folder: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    isExpanded: {
      type: Boolean,
      default: false
    },
    isDragging: {
      type: Boolean,
      default: false
    },
    fileCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['toggle', 'dragstart', 'dragend', 'dragover', 'drop', 'dragleave']
})
</script>