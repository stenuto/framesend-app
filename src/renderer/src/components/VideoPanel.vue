<template>
  <div v-if="selectedVideo"
    class="relative shrink-0 h-full dark:bg-zinc-900 bg-white border-l dark:border-white/10 border-zinc-200"
    :style="{ width: `${width}px` }">
    <!-- Resize handle -->
    <div class="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 group"
      @mousedown="$emit('start-resize', $event)">
      <div class="absolute left-0 top-0 w-4 h-full -translate-x-2"></div>
    </div>


    <div class="h-12 flex items-center justify-between shrink-0 drag bg-white/40 dark:bg-zinc-900 px-3">
      <div class=" flex items-center justify-between w-full">
        <h3 class="text-sm font-medium">{{ selectedVideo.name || 'Video Title' }}</h3>
        <Button icon-name="x" size="sm" variant="ghost" class="text-zinc-500" @click="closePanel" />
      </div>
    </div>
    <!-- Panel content -->
    <div class="h-full overflow-auto p-2.5 border-t border-black/10 dark:border-zinc-700/50">
      <!-- Playable Video (only if ready) -->
      <VideoPlayer v-if="selectedVideo.status === 'ready'" :src="videoSrc" />

      <!-- Processing Status -->
      <div v-else-if="selectedVideo.status === 'processing' || selectedVideo.status === 'queued'"
        class="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <div v-if="selectedVideo.status === 'processing'" class="mb-4">
            <svg class="size-12 -rotate-90 mx-auto" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"
                class="text-current/20" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"
                :stroke-dasharray="`${2 * Math.PI * 10}`"
                :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (selectedVideo.progress || 0) / 100)}`"
                class="text-blue-500 transition-all duration-500" stroke-linecap="round" />
            </svg>
            <p class="text-sm font-medium mt-2">{{ Math.round(selectedVideo.progress || 0) }}%</p>
          </div>
          <Icon v-else name="clock" class="size-12 text-current/30 mb-4 mx-auto" />
          <p class="text-sm text-current/60">
            {{ selectedVideo.status === 'processing' ? 'Encoding in progress' : 'Queued for encoding' }}
          </p>
          <p v-if="selectedVideo.currentStage" class="text-xs text-current/40 mt-1">
            {{ getStageDescription(selectedVideo.currentStage) }}
          </p>
        </div>
      </div>

      <!-- Failed Status -->
      <div v-else-if="selectedVideo.status === 'failed'"
        class="aspect-video bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
        <div class="text-center">
          <Icon name="alert-circle" class="size-12 text-red-500 mb-4 mx-auto" />
          <p class="text-sm text-red-600 dark:text-red-400">Encoding failed</p>
        </div>
      </div>

      <!-- Video Details -->
      <div class="mt-3 text-current">
        <h2 class="text-lg font-medium">{{ selectedVideo.name || 'Video Title' }}</h2>
        <div class="flex items-center gap-4 text-sm text-current/50 mt-1">
          <span v-if="selectedVideo.duration">{{ formatDuration(selectedVideo.duration) }}</span>
          <span v-if="selectedVideo.size">{{ selectedVideo.size }}</span>
          <span v-if="selectedVideo.validation?.metadata?.streams?.[0]">
            {{ selectedVideo.validation.metadata.streams[0].width }}×{{
              selectedVideo.validation.metadata.streams[0].height }}
          </span>
        </div>
      </div>

      <pre
        class="font-mono text-xs text-current/50 whitespace-pre-wrap mt-4">{{ JSON.stringify(selectedVideo, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import VideoPlayer from './VideoPlayer.vue'
import Icon from '@/components/base/Icon.vue'
import Button from '@/components/base/Button.vue'
import { defineProps, defineEmits, computed } from 'vue'

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

// Hardcoded for now - will be dynamic based on video ID later
const videoSrc = computed(() => {
  // In the future, this will use the actual video ID from the server
  return 'https://videoflare.stenuto.workers.dev/W42komAoK9/playlist.m3u8'
})

// Stage descriptions
const stageDescriptions = {
  probe: 'Analyzing video',
  plan: 'Planning encoding',
  audio: 'Extracting audio',
  encode: 'Encoding video',
  assets: 'Generating thumbnails',
  captions: 'Creating captions',
  manifest: 'Creating manifest',
  metadata: 'Writing metadata',
  finalize: 'Finalizing'
}

function getStageDescription(stage) {
  return stageDescriptions[stage] || stage
}

function formatDuration(duration) {
  if (typeof duration === 'string') return duration

  const seconds = Math.floor(duration)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>