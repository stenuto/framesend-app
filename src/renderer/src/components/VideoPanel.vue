<template>
  <div v-if="selectedVideo"
    class="relative shrink-0 h-full dark:bg-zinc-900 bg-white border-l dark:border-white/10 border-zinc-200"
    :style="{ width: `${width}px` }">
    <!-- Resize handle -->
    <div class="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 group"
      @mousedown="$emit('start-resize', $event)">
      <div class="absolute left-0 top-0 w-4 h-full -translate-x-2"></div>
    </div>

    <!-- Panel content -->
    <div class="p-4 h-full overflow-auto">
      <pre class="font-mono text-xs text-current/50 whitespace-pre-wrap">{{ JSON.stringify(selectedVideo, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  selectedVideo: {
    type: Object,
    default: null
  },
  width: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['start-resize'])
</script>