<template>
  <div class="group relative" :class="{ 'bg-blue-500/10 dark:bg-blue-500/10': isSelected }">
    <div class="flex items-center py-3 px-4 dark:hover:bg-white/3 hover:bg-black/3 transition-colors cursor-pointer"
      @click="handleClick">
      <!-- Status Icon -->
      <div class="w-10 flex-shrink-0">
        <!-- Ready -->
        <div v-if="job.status === 'ready'"
          class="size-8 rounded-full dark:bg-emerald-800/15 bg-emerald-100 flex items-center justify-center">
          <Icon name="check" class="size-4 dark:text-emerald-500 text-emerald-600" />
        </div>
        
        <!-- Processing -->
        <div v-else-if="job.status === 'processing'" 
          class="size-8 relative flex items-center justify-center">
          <svg class="size-8 -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" fill="none"
              class="dark:text-white/10 text-black/10" />
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" fill="none"
              :stroke-dasharray="`${2 * Math.PI * 10}`"
              :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (job.progress || 0) / 100)}`"
              class="dark:text-blue-500 text-blue-600 transition-all duration-500" 
              stroke-linecap="round" />
          </svg>
          <span class="absolute text-[10px] font-medium">
            {{ Math.round(job.progress || 0) }}
          </span>
        </div>
        
        <!-- Queued -->
        <div v-else-if="job.status === 'queued'"
          class="size-8 rounded-full dark:bg-zinc-700/30 bg-zinc-100 flex items-center justify-center">
          <Icon name="clock" class="size-4 dark:text-zinc-400 text-zinc-500" />
        </div>
        
        <!-- Failed -->
        <div v-else-if="job.status === 'failed'"
          class="size-8 rounded-full dark:bg-red-900/20 bg-red-100 flex items-center justify-center">
          <Icon name="alert-circle" class="size-4 dark:text-red-400 text-red-600" />
        </div>
      </div>

      <!-- File Info -->
      <div class="flex-1 min-w-0 px-4">
        <div class="flex items-baseline gap-3">
          <h3 class="text-sm font-medium truncate">{{ videoName }}</h3>
          <span v-if="job.file.size" class="text-xs dark:text-current/50 text-current/60">
            {{ formatFileSize(job.file.size) }}
          </span>
        </div>
        
        <!-- Progress/Status Details -->
        <div class="mt-1">
          <!-- Processing details -->
          <div v-if="job.status === 'processing' && job.currentStage" 
            class="text-xs dark:text-current/50 text-current/60">
            {{ getStageDescription(job.currentStage) }}
            <span v-if="job.details?.currentRendition" class="ml-1">
              • {{ job.details.currentRendition }}
            </span>
          </div>
          
          <!-- Queued position -->
          <div v-else-if="job.status === 'queued' && queuePosition > 0" 
            class="text-xs dark:text-current/50 text-current/60">
            Position {{ queuePosition }} in queue
          </div>
          
          <!-- Error message -->
          <div v-else-if="job.status === 'failed' && job.error" 
            class="text-xs text-red-500 dark:text-red-400">
            {{ job.error }}
          </div>
          
          <!-- Completion time -->
          <div v-else-if="job.status === 'ready' && job.completedAt" 
            class="text-xs dark:text-current/50 text-current/60">
            Completed {{ formatTimeAgo(job.completedAt) }}
          </div>
        </div>
      </div>

      <!-- Duration/Resolution -->
      <div class="w-32 text-sm dark:text-current/60 text-current/70 text-right">
        <div v-if="job.validation?.metadata">
          {{ formatDuration(job.validation.metadata.duration) }}
        </div>
        <div v-if="job.validation?.metadata?.streams?.[0]" class="text-xs dark:text-current/40 text-current/50">
          {{ job.validation.metadata.streams[0].width }}×{{ job.validation.metadata.streams[0].height }}
        </div>
      </div>

      <!-- Actions -->
      <div class="w-24 flex items-center justify-end gap-2">
        <!-- Cancel/Remove button -->
        <button
          v-if="job.status === 'processing' || job.status === 'queued'"
          @click="$emit('cancel', job.id)"
          class="p-1.5 rounded-smooth dark:hover:bg-white/10 hover:bg-black/10 transition-colors"
          :title="job.status === 'processing' ? 'Cancel encoding' : 'Remove from queue'">
          <Icon name="x" class="size-4" />
        </button>
        
        <!-- Remove completed/failed -->
        <button
          v-else
          @click="$emit('remove', job.id)"
          class="p-1.5 rounded-smooth dark:hover:bg-white/10 hover:bg-black/10 opacity-0 group-hover:opacity-100 transition-all"
          title="Remove from list">
          <Icon name="trash" class="size-4" />
        </button>
      </div>
    </div>

    <!-- Progress bar for processing jobs -->
    <div v-if="job.status === 'processing'" 
      class="absolute bottom-0 left-0 right-0 h-[1px] bg-current/5">
      <div 
        class="h-full bg-blue-500 transition-all duration-500"
        :style="{ width: `${job.progress || 0}%` }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Icon from '@/components/base/Icon.vue'
import { useVideoMetadataStore } from '@/stores/videoMetadata'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'

const props = defineProps({
  job: {
    type: Object,
    required: true
  },
  queuePosition: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['cancel', 'remove'])

// Get stores
const metadataStore = useVideoMetadataStore()
const uiStore = useUIStore()

// Reactive video name from metadata store
const videoName = computed(() => {
  return metadataStore.getVideoName(props.job.id, props.job.file.name)
})

// Check if this video is selected
const isSelected = computed(() => {
  return uiStore.selectedVideo?.jobId === props.job.id
})

// Handle click to select video
function handleClick(e) {
  // Don't select if clicking on action buttons
  if (e.target.closest('button')) {
    return
  }
  
  // Transform job data to match video panel format
  const videoData = {
    id: `queue_${props.job.id}`,
    type: 'video',
    name: videoName.value,
    jobId: props.job.id,
    status: props.job.status,
    progress: props.job.progress,
    duration: props.job.validation?.metadata?.duration || '0:00',
    size: formatFileSize(props.job.file.size),
    filePath: props.job.file.path,
    // Additional metadata
    validation: props.job.validation,
    stages: props.job.stages,
    currentStage: props.job.currentStage,
    details: props.job.details
  }
  
  uiStore.selectVideo(videoData)
}

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

function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatTimeAgo(date) {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
</script>