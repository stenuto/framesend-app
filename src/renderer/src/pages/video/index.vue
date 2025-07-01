<template>
  <div class="video-page flex flex-col h-full">
    <!-- Video Header -->
    <div class="px-6 py-4 border-b border-zinc-700">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-zinc-100">
            {{ videoStore.videoTitle }}
          </h1>
          <p v-if="videoStore.hasVideo" class="text-sm text-zinc-400 mt-1">
            {{ videoStore.currentVideo.path }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="handleExport"
            class="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors">
            Export
          </button>
          <button @click="handleShare"
            class="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600 transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>

    <!-- Video Player Area -->
    <div class="flex-1 flex items-center justify-center p-6">
      <div v-if="videoStore.hasVideo" class="w-full max-w-5xl">
        <!-- Video Player Placeholder -->
        <div class="relative bg-black rounded-lg overflow-hidden aspect-video">
          <!-- This is where the actual video player would go -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <Icon name="video" class="size-24 text-zinc-600 mb-4" />
              <p class="text-zinc-400">Video player placeholder</p>
              <p class="text-sm text-zinc-500 mt-2">{{ videoStore.videoPath }}</p>
            </div>
          </div>

          <!-- Video Controls Overlay -->
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div class="space-y-2">
              <!-- Progress Bar -->
              <div class="flex items-center gap-2 text-sm text-white">
                <span>{{ videoStore.formattedCurrentTime }}</span>
                <div class="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden cursor-pointer" @click="handleSeek">
                  <div class="h-full bg-amber-500 transition-all duration-100"
                    :style="{ width: `${videoStore.progress}%` }" />
                </div>
                <span>{{ videoStore.formattedDuration }}</span>
              </div>

              <!-- Control Buttons -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <button @click="videoStore.skipBackward()"
                    class="p-2 text-white hover:text-amber-400 transition-colors">
                    <Icon name="skip-back" class="size-5" />
                  </button>
                  <button @click="videoStore.togglePlayback()"
                    class="p-2 text-white hover:text-amber-400 transition-colors">
                    <Icon :name="videoStore.isPlaying ? 'pause' : 'play'" class="size-6" />
                  </button>
                  <button @click="videoStore.skipForward()"
                    class="p-2 text-white hover:text-amber-400 transition-colors">
                    <Icon name="skip-forward" class="size-5" />
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button @click="videoStore.toggleMute()"
                    class="p-2 text-white hover:text-amber-400 transition-colors">
                    <Icon :name="videoStore.isMuted ? 'volume-x' : 'volume-2'" class="size-5" />
                  </button>
                  <button @click="toggleFullscreen" class="p-2 text-white hover:text-amber-400 transition-colors">
                    <Icon name="maximize" class="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Video Info -->
        <div class="mt-6 space-y-4">
          <div class="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <h2 class="text-sm font-medium text-zinc-100 mb-3">Video Information</h2>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-zinc-400">Duration</dt>
                <dd class="text-zinc-100 font-medium">{{ videoStore.currentVideo.duration || 'Unknown' }}</dd>
              </div>
              <div>
                <dt class="text-zinc-400">File Size</dt>
                <dd class="text-zinc-100 font-medium">{{ formatFileSize(videoStore.currentVideo.metadata?.size) }}</dd>
              </div>
              <div>
                <dt class="text-zinc-400">Created</dt>
                <dd class="text-zinc-100 font-medium">{{ formatDate(videoStore.currentVideo.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-zinc-400">Modified</dt>
                <dd class="text-zinc-100 font-medium">{{ formatDate(videoStore.currentVideo.updatedAt) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- No Video Selected -->
      <div v-else class="text-center">
        <Icon name="video-off" class="size-24 text-zinc-600 mb-4" />
        <h2 class="text-xl font-medium text-zinc-300 mb-2">No Video Selected</h2>
        <p class="text-zinc-400">Select a video from the file explorer to begin</p>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, watch } from 'vue'
import { useVideoStore } from '../../stores/video'
import { useRouterStore } from '../../stores/router'
import { useFileExplorerStore } from '../../stores/fileExplorer'
import Icon from '../../components/base/Icon.vue'

export default {
  name: 'VideoPage',
  components: {
    Icon
  },
  meta: {
    title: 'Video Player',
    icon: 'video'
  },
  setup() {
    const videoStore = useVideoStore()
    const routerStore = useRouterStore()
    const fileExplorerStore = useFileExplorerStore()

    // Watch for route parameter changes to load the correct video
    watch(() => routerStore.currentParams, (newParams) => {
      if (newParams.id) {
        const video = fileExplorerStore.getFileById(newParams.id)
        if (video) {
          videoStore.selectVideo(video)
        }
      }
    }, { immediate: true })

    // For demo purposes, set a fake duration
    if (videoStore.hasVideo && !videoStore.duration) {
      videoStore.setDuration(180) // 3 minutes
    }

    // Keyboard shortcuts
    const handleKeyPress = (event) => {
      if (!videoStore.hasVideo) return

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          videoStore.togglePlayback()
          break
        case 'ArrowLeft':
          event.preventDefault()
          videoStore.skipBackward(5)
          break
        case 'ArrowRight':
          event.preventDefault()
          videoStore.skipForward(5)
          break
      }
    }

    // Add keyboard listener on mount
    onMounted(() => {
      window.addEventListener('keydown', handleKeyPress)
    })

    // Remove keyboard listener on unmount
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyPress)
    })

    const handleSeek = (event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const percent = ((event.clientX - rect.left) / rect.width) * 100
      videoStore.seekByPercent(percent)
    }

    const handleExport = () => {
      console.log('Export video:', videoStore.currentVideo)
    }

    const handleShare = () => {
      console.log('Share video:', videoStore.currentVideo)
    }

    const toggleFullscreen = () => {
      console.log('Toggle fullscreen')
    }

    const formatFileSize = (bytes) => {
      if (!bytes) return 'Unknown'
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
    }

    const formatDate = (date) => {
      if (!date) return 'Unknown'
      return new Date(date).toLocaleDateString()
    }

    return {
      videoStore,
      handleSeek,
      handleExport,
      handleShare,
      toggleFullscreen,
      formatFileSize,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Custom video player styles */
.video-page {
  min-height: 100%;
}
</style>