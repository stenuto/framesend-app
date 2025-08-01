<template>
<div v-if="selectedVideo" class="relative shrink-0 h-full bg-zinc-850 border-l border-white/10"
  :style="{ width: `${width}px` }">
  <!-- Resize handle -->
  <div class="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 group"
    @mousedown="$emit('start-resize', $event)">
    <div class="absolute left-0 top-0 w-4 h-full -translate-x-2"></div>
  </div>


  <div class="h-12 flex items-center justify-between shrink-0 drag bg-zinc-850 px-3">
    <div class=" flex items-center justify-between w-full">
      <h3 class="text-sm font-medium flex-1 truncate">{{ selectedVideo.name || 'Video Title' }}</h3>
      <Button icon-name="x" size="sm" variant="ghost" class="text-zinc-500" @click="closePanel" />
    </div>
  </div>
  <!-- Panel content -->
  <div class="h-full overflow-hidden flex flex-col">
    <!-- Video Player -->
    <VideoPlayer v-if="selectedVideo.status === 'ready' && selectedVideo.jobId"
      :video-id="selectedVideo.id"
      :job-id="selectedVideo.jobId" />
  </div>
</div>
</template>

<script setup>
import VideoPlayer from './VideoPlayer.vue'
import Icon from '@/components/base/Icon.vue'
import Button from '@/components/base/Button.vue'
import { defineProps, defineEmits, computed } from 'vue'
import { useUIStore } from '@/stores/ui'

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

const uiStore = useUIStore()

function closePanel() {
  uiStore.clearSelectedVideo()
}

</script>