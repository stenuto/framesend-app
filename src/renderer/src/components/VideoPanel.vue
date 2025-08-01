<template>
<div v-if="selectedVideo" class="relative shrink-0 h-full border-l border-white/10 w-[400px] flex flex-col">
  <!-- Header -->
  <div class="h-12 flex items-center justify-between shrink-0 drag px-4 border-b border-zinc-800">
    <div class="flex items-center justify-between w-full gap-2">
      <!-- Editable title -->
      <div class="flex-1 min-w-0">
        <input
          v-if="isEditingTitle"
          v-model="editingTitle"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          @keyup.escape="cancelTitleEdit"
          ref="titleInput"
          class="w-full text-sm font-medium bg-zinc-800 text-zinc-100 px-2 py-1 rounded-smooth outline-none focus:ring-1 focus:ring-zinc-600" />
        <h3
          v-else
          @dblclick="startEditingTitle"
          class="text-sm font-medium truncate cursor-text hover:text-zinc-100 text-zinc-200"
          title="Double-click to edit">
          {{ selectedVideo.name || 'Untitled' }}
        </h3>
      </div>
      <div class="flex items-center gap-1">
        <Button
          :icon-name="videoFitMode === 'cover' ? 'unfold-horizontal' : 'unfold-vertical'"
          size="sm"
          variant="ghost"
          class="text-zinc-500"
          @click="toggleVideoFitMode"
          :title="videoFitMode === 'cover' ? 'Fit to frame' : 'Fill frame'" />
        <Button icon-name="x" size="sm" variant="ghost" class="text-zinc-500" @click="closePanel" />
      </div>
    </div>
  </div>

  <!-- Video Player - Full height -->
  <div class="flex-1 bg-black overflow-hidden">
    <!-- Video Player -->
    <div v-if="selectedVideo.status === 'ready' && selectedVideo.jobId" class="h-full w-full">
      <MediaChromePlayer
        :video-id="selectedVideo.id"
        :job-id="selectedVideo.jobId"
        :fit-mode="videoFitMode" />
    </div>

    <!-- Encoding progress -->
    <div v-else-if="selectedVideo.status === 'processing' || selectedVideo.status === 'queued'" class="h-full w-full flex items-center justify-center">
      <div class="text-center px-4">
        <div class="mb-4">
          <div v-if="encodingJob" class="w-16 h-16 mx-auto mb-3">
            <svg class="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgb(63 63 70)"
                stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgb(34 211 238)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="`${2 * Math.PI * 45}`"
                :stroke-dashoffset="`${2 * Math.PI * 45 * (1 - (encodingJob.progress || 0) / 100)}`"
                transform="rotate(-90 50 50)"
                class="transition-all duration-300" />
              <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" class="fill-zinc-100 text-lg font-medium">
                {{ Math.round(encodingJob?.progress || 0) }}%
              </text>
            </svg>
          </div>
          <p class="text-sm font-medium text-zinc-100 mb-1">
            {{ selectedVideo.status === 'queued' ? 'Queued' : 'Encoding' }}
          </p>
          <p v-if="encodingJob?.currentStage" class="text-xs text-zinc-400">
            {{ encodingJob.currentStage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="selectedVideo.status === 'error'" class="h-full w-full flex items-center justify-center">
      <div class="text-center px-4">
        <Icon name="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p class="text-sm text-zinc-400">Encoding failed</p>
      </div>
    </div>

    <!-- No video state -->
    <div v-else class="h-full w-full flex items-center justify-center">
      <div class="text-center px-4">
        <Icon name="video-off" class="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <p class="text-sm text-zinc-500">Video not available</p>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useVideoEncodingStore } from '@/stores/videoEncoding'
import { useProjectsStore } from '@/stores/projects'
import MediaChromePlayer from './MediaChromePlayer.vue'
import Icon from '@/components/base/Icon.vue'
import Button from '@/components/base/Button.vue'

const props = defineProps({
  selectedVideo: {
    type: Object,
    default: null
  }
})

const uiStore = useUIStore()
const videoEncodingStore = useVideoEncodingStore()
const projectsStore = useProjectsStore()

// Title editing
const isEditingTitle = ref(false)
const editingTitle = ref('')
const titleInput = ref(null)

// Video fit mode
const videoFitMode = ref('cover') // 'cover' or 'contain'

// Get encoding job if video is encoding
const encodingJob = computed(() => {
  if (!props.selectedVideo?.jobId) return null
  return videoEncodingStore.jobs.get(props.selectedVideo.jobId)
})

// Start editing title
const startEditingTitle = () => {
  editingTitle.value = props.selectedVideo.name || 'Untitled'
  isEditingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

// Save title
const saveTitle = () => {
  const newName = editingTitle.value.trim()
  if (newName && newName !== props.selectedVideo.name) {
    // Update the video name in the project store
    projectsStore.updateFileSystemItemName(props.selectedVideo.id, newName)
  }
  isEditingTitle.value = false
}

// Cancel title edit
const cancelTitleEdit = () => {
  isEditingTitle.value = false
  editingTitle.value = ''
}

// Toggle video fit mode
const toggleVideoFitMode = () => {
  videoFitMode.value = videoFitMode.value === 'cover' ? 'contain' : 'cover'
}

// Close panel
const closePanel = () => {
  uiStore.clearSelectedVideo()
}

// Watch for video changes to reset editing state
watch(() => props.selectedVideo, () => {
  isEditingTitle.value = false
  editingTitle.value = ''
})
</script>