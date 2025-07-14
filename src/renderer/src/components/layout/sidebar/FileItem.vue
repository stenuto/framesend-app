<template>
  <div
    :class="[
      'group flex items-center gap-1 h-5 rounded cursor-pointer select-none',
      'hover:bg-zinc-800/50 transition-colors',
      isDragging && 'opacity-50'
    ]"
    :style="{ paddingLeft: `${14 + depth * 12}px` }"
    draggable="true"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @drop.prevent="$emit('drop', $event)"
  >
    <Icon name="film" class="w-3 h-3 text-zinc-500 flex-shrink-0" />
    <div class="flex-1 min-w-0 flex items-baseline gap-1.5">
      <p class="text-[13px] text-zinc-300 truncate">{{ file.name }}</p>
      <p class="text-[11px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
        {{ file.metadata?.duration || '' }}
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Icon from '@components/base/Icon.vue'

export default defineComponent({
  name: 'FileItem',
  components: {
    Icon
  },
  props: {
    file: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    isDragging: {
      type: Boolean,
      default: false
    }
  },
  emits: ['dragstart', 'dragend', 'dragover', 'drop']
})
</script>