<template>
<div
  class="relative bg-black rounded-smooth-lg overflow-hidden group h-full w-full"
  @mousemove="handleMouseMove"
  @mouseleave="handleMouseLeave"
  @contextmenu.prevent="handleContextMenu">
  <!-- Video element -->
  <video
    ref="videoEl"
    :class="['w-full h-full', props.fitMode === 'cover' ? 'object-cover' : 'object-contain']"
    @loadedmetadata="handleLoadedMetadata"
    @timeupdate="handleTimeUpdate"
    @progress="handleProgress"
    @play="isPlaying = true"
    @pause="isPlaying = false"
    @volumechange="handleVolumeChange"
    @click="togglePlayPause" />

  <!-- Loading overlay -->
  <div
    v-if="loading"
    class="absolute inset-0 flex items-center justify-center bg-black/50">
    <div class="flex flex-col items-center gap-2">
      <div class="w-8 h-8 border-2 border-zinc-600 border-t-zinc-100 rounded-full animate-spin" />
      <span class="text-xs text-zinc-400">Loading video...</span>
    </div>
  </div>

  <!-- Error overlay -->
  <div
    v-if="error"
    class="absolute inset-0 flex items-center justify-center bg-black/50">
    <div class="flex flex-col items-center gap-2 text-center px-4">
      <Icon name="video-off" class="w-8 h-8 text-zinc-500" />
      <p class="text-sm text-zinc-400">{{ error }}</p>
    </div>
  </div>

  <!-- Controls overlay -->
  <div
    v-show="showControls && !loading && !error"
    class="absolute inset-0 pointer-events-none">

    <!-- Bottom controls -->
    <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-auto">
      <!-- Progress bar -->
      <div class="px-4 pb-2">
        <div
          class="relative h-[4px] bg-zinc-800 rounded-full cursor-pointer group/progress"
          @click="handleProgressClick"
          @mouseenter="showProgressPreview = true"
          @mouseleave="showProgressPreview = false"
          @mousemove="handleProgressMouseMove">
          <!-- Buffered progress -->
          <div
            class="absolute h-full bg-zinc-700 rounded-full"
            :style="{ width: `${bufferedPercent}%` }" />

          <!-- Playback progress -->
          <div
            class="absolute h-full bg-blue-500 rounded-full transition-all duration-150"
            :style="{ width: `${progressPercent}%` }" />

          <!-- Scrubber -->
          <div
            class="absolute top-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"
            :style="{ left: `${progressPercent}%`, transform: 'translate(-50%, -50%)' }" />

          <!-- Preview time tooltip -->
          <div
            v-if="showProgressPreview"
            class="absolute -top-8 bg-zinc-900 text-xs text-zinc-100 px-2 py-1 rounded-smooth pointer-events-none"
            :style="{ left: `${previewPercent}%`, transform: 'translateX(-50%)' }">
            {{ formatTime(previewTime) }}
          </div>
        </div>
      </div>

      <!-- Control buttons -->
      <div class="flex items-center justify-between px-4 pb-4">
        <!-- Left controls -->
        <div class="flex items-center gap-2">
          <!-- Play/Pause -->
          <Button
            :icon-name="isPlaying ? 'pause' : 'play'"
            variant="ghost"
            size="sm"
            @click="togglePlayPause"
            :title="isPlaying ? 'Pause (Space)' : 'Play (Space)'" />

          <!-- Skip backward -->
          <Button
            icon-name="skip-back"
            variant="ghost"
            size="sm"
            @click="skipBackward"
            title="Skip backward 10s (←)" />

          <!-- Skip forward -->
          <Button
            icon-name="skip-forward"
            variant="ghost"
            size="sm"
            @click="skipForward"
            title="Skip forward 10s (→)" />

          <!-- Time display -->
          <div class="flex items-center gap-1 text-xs ml-2">
            <span class="text-zinc-100">{{ formatTime(currentTime) }}</span>
            <span class="text-zinc-500">/</span>
            <span class="text-zinc-400">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- Right controls -->
        <div class="flex items-center gap-2">
          <!-- Volume controls -->
          <div class="flex items-center gap-2 group/volume">
            <Button
              :icon-name="isMuted || volume === 0 ? 'volume-x' : 'volume-2'"
              variant="ghost"
              size="sm"
              @click="toggleMute"
              :title="isMuted ? 'Unmute (M)' : 'Mute (M)'" />

            <!-- Volume slider -->
            <div class="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200">
              <input
                type="range"
                v-model="volume"
                @input="handleVolumeInput"
                min="0"
                max="100"
                step="1"
                class="w-full h-[4px] bg-zinc-700 rounded-full appearance-none cursor-pointer volume-slider"
                :title="`Volume: ${volume}%`" />
            </div>
          </div>

          <!-- Quality selector -->
          <Dropdown
            v-if="qualities.length > 1"
            v-model="selectedQuality"
            :options="qualities"
            option-label="label"
            option-value="value"
            size="sm"
            variant="ghost"
            button-class="text-xs"
            :disabled="loading" />

          <!-- Fullscreen -->
          <Button
            icon-name="maximize"
            variant="ghost"
            size="sm"
            @click="toggleFullscreen"
            title="Fullscreen (F)" />
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Hls from 'hls.js'
import { useKeybindings } from '@/composables/useKeybinding'
import Icon from '@/components/base/Icon.vue'
import Button from '@/components/base/Button.vue'
import Dropdown from '@/components/base/Dropdown.vue'

const props = defineProps({
  videoId: {
    type: String,
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  fitMode: {
    type: String,
    default: 'cover',
    validator: (value) => ['cover', 'contain'].includes(value)
  }
})

// Refs
const videoEl = ref(null)
const hls = ref(null)

// State
const loading = ref(true)
const error = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const bufferedPercent = ref(0)
const progressPercent = ref(0)
const volume = ref(100)
const isMuted = ref(false)
const showControls = ref(true)
const showProgressPreview = ref(false)
const previewPercent = ref(0)
const previewTime = ref(0)
const qualities = ref([])
const selectedQuality = ref(-1)

// Control visibility timer
let controlsTimer = null

// Computed properties
const manifestUrl = computed(() => {
  if (!props.jobId) return null

  // Get username from environment or fallback
  const pathParts = window.location.pathname.split('/')
  let username = 'stephentenuto' // fallback

  if (pathParts.includes('Users') && pathParts.length > pathParts.indexOf('Users') + 1) {
    username = pathParts[pathParts.indexOf('Users') + 1]
  }

  const basePath = `/Users/${username}/Library/Application Support/framesend-app`
  return `file://${basePath}/encoded-videos/${props.jobId}/master.m3u8`
})

// Methods
const initializeHls = () => {
  if (!manifestUrl.value || !videoEl.value) return

  error.value = null
  loading.value = true

  if (Hls.isSupported()) {
    // Create HLS instance
    hls.value = new Hls({
      startLevel: -1, // Start with highest quality
      autoStartLoad: true,
      debug: false
    })

    // Load manifest
    hls.value.loadSource(manifestUrl.value)
    hls.value.attachMedia(videoEl.value)

    // Handle HLS events
    hls.value.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      // Extract quality levels
      qualities.value = data.levels.map((level, index) => ({
        value: index,
        label: `${level.height}p`,
        height: level.height,
        bitrate: level.bitrate
      })).reverse() // Reverse to show highest quality first

      // Set default to highest quality
      if (qualities.value.length > 0) {
        selectedQuality.value = qualities.value[0].value
        hls.value.currentLevel = selectedQuality.value
      }

      loading.value = false
    })

    hls.value.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        loading.value = false
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            error.value = 'Network error loading video'
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            error.value = 'Media error - video format not supported'
            break
          default:
            error.value = 'An error occurred loading the video'
            break
        }
      }
    })
  } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    videoEl.value.src = manifestUrl.value
    loading.value = false
  } else {
    error.value = 'HLS is not supported in this browser'
    loading.value = false
  }
}

const destroyHls = () => {
  if (hls.value) {
    hls.value.destroy()
    hls.value = null
  }
}

const togglePlayPause = () => {
  if (!videoEl.value) return

  if (isPlaying.value) {
    videoEl.value.pause()
  } else {
    videoEl.value.play()
  }
}

const skipBackward = () => {
  if (!videoEl.value) return
  videoEl.value.currentTime = Math.max(0, videoEl.value.currentTime - 10)
}

const skipForward = () => {
  if (!videoEl.value) return
  videoEl.value.currentTime = Math.min(duration.value, videoEl.value.currentTime + 10)
}

const seekByFrame = (direction) => {
  if (!videoEl.value || isPlaying.value) return

  // Approximate frame duration (assuming 30fps)
  const frameDuration = 1 / 30

  if (direction === 'forward') {
    videoEl.value.currentTime = Math.min(duration.value, videoEl.value.currentTime + frameDuration)
  } else {
    videoEl.value.currentTime = Math.max(0, videoEl.value.currentTime - frameDuration)
  }
}

const toggleMute = () => {
  if (!videoEl.value) return

  if (isMuted.value) {
    videoEl.value.muted = false
    videoEl.value.volume = volume.value / 100
  } else {
    videoEl.value.muted = true
  }
}

const handleVolumeInput = (e) => {
  if (!videoEl.value) return

  const newVolume = parseInt(e.target.value)
  volume.value = newVolume
  videoEl.value.volume = newVolume / 100
  videoEl.value.muted = false
  isMuted.value = false
}

const handleVolumeChange = () => {
  if (!videoEl.value) return

  isMuted.value = videoEl.value.muted
  if (!videoEl.value.muted) {
    volume.value = Math.round(videoEl.value.volume * 100)
  }
}

const adjustVolume = (delta) => {
  if (!videoEl.value) return

  const newVolume = Math.max(0, Math.min(100, volume.value + delta))
  volume.value = newVolume
  videoEl.value.volume = newVolume / 100
  videoEl.value.muted = false
  isMuted.value = false
}

const toggleFullscreen = async () => {
  const container = videoEl.value?.parentElement
  if (!container) return

  if (!document.fullscreenElement) {
    await container.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

const handleLoadedMetadata = () => {
  if (!videoEl.value) return
  duration.value = videoEl.value.duration
}

const handleTimeUpdate = () => {
  if (!videoEl.value || !duration.value) return

  currentTime.value = videoEl.value.currentTime
  progressPercent.value = (currentTime.value / duration.value) * 100
}

const handleProgress = () => {
  if (!videoEl.value) return

  const buffered = videoEl.value.buffered
  if (buffered.length > 0) {
    const bufferedEnd = buffered.end(buffered.length - 1)
    bufferedPercent.value = (bufferedEnd / duration.value) * 100
  }
}

const handleProgressClick = (e) => {
  if (!videoEl.value || !duration.value) return

  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  const time = (percent / 100) * duration.value

  videoEl.value.currentTime = time
}

const handleProgressMouseMove = (e) => {
  if (!duration.value) return

  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100

  previewPercent.value = Math.max(0, Math.min(100, percent))
  previewTime.value = (previewPercent.value / 100) * duration.value
}

const handleMouseMove = () => {
  showControls.value = true
  resetControlsTimer()
}

const handleMouseLeave = () => {
  if (isPlaying.value) {
    startControlsTimer()
  }
}

const resetControlsTimer = () => {
  clearTimeout(controlsTimer)
  if (isPlaying.value) {
    startControlsTimer()
  }
}

const startControlsTimer = () => {
  controlsTimer = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}

const handleContextMenu = async (e) => {
  const menuTemplate = [
    {
      label: isPlaying.value ? 'Pause' : 'Play',
      action: 'video:play-pause'
    },
    { type: 'separator' },
    {
      label: 'Skip Backward 10s',
      action: 'video:skip-backward'
    },
    {
      label: 'Skip Forward 10s',
      action: 'video:skip-forward'
    },
    { type: 'separator' },
    {
      label: 'Thumbnail',
      submenu: [
        {
          label: 'Set as Current Frame',
          action: 'video:set-thumbnail'
        },
        {
          label: 'Upload Image...',
          action: 'video:upload-thumbnail'
        },
        { type: 'separator' },
        {
          label: 'Copy Frame',
          action: 'video:copy-frame'
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Show Video Info',
      action: 'video:info'
    }
  ]

  await window.api.menu.showContext(menuTemplate, {
    x: e.clientX,
    y: e.clientY
  })
}

const handleMenuAction = async (action) => {
  switch (action) {
    case 'video:play-pause':
      togglePlayPause()
      break
    case 'video:skip-backward':
      skipBackward()
      break
    case 'video:skip-forward':
      skipForward()
      break
    case 'video:set-thumbnail':
      // TODO: Implement setting current frame as thumbnail
      console.log('Set current frame as thumbnail')
      break
    case 'video:upload-thumbnail':
      await handleThumbnailUpload()
      break
    case 'video:copy-frame':
      // TODO: Implement frame copy to clipboard
      console.log('Copy frame to clipboard')
      break
    case 'video:info':
      // TODO: Show video info dialog
      console.log('Show video info')
      break
  }
}

const handleThumbnailUpload = async () => {
  try {
    // Call main process handler which will show file dialog and mock API
    const response = await window.api.video.uploadThumbnail(props.videoId)
    
    if (!response) {
      // User cancelled
      return
    }
    
    // Handle successful upload
    if (response.success) {
      console.log('Thumbnail upload successful:', response.data)
      // In a real app, we might emit an event or update the UI
    }
    
  } catch (error) {
    console.error('Error uploading thumbnail:', error)
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Register keyboard shortcuts
useKeybindings({
  'video:play-pause': togglePlayPause,
  'video:seek-backward': () => {
    if (isPlaying.value) {
      skipBackward()
    } else {
      seekByFrame('backward')
    }
  },
  'video:seek-forward': () => {
    if (isPlaying.value) {
      skipForward()
    } else {
      seekByFrame('forward')
    }
  },
  'video:volume-up': () => adjustVolume(10),
  'video:volume-down': () => adjustVolume(-10),
  'video:mute': toggleMute,
  'video:fullscreen': toggleFullscreen,
  'video:frame-backward': () => seekByFrame('backward'),
  'video:frame-forward': () => seekByFrame('forward')
})

// Watch for quality changes
watch(selectedQuality, (newQuality) => {
  if (hls.value && newQuality >= 0) {
    hls.value.currentLevel = newQuality
  }
})

// Watch for manifest URL changes
watch(manifestUrl, () => {
  destroyHls()
  if (manifestUrl.value) {
    nextTick(() => {
      initializeHls()
    })
  }
})

// Lifecycle
let menuUnsubscribe = null

onMounted(() => {
  initializeHls()
  menuUnsubscribe = window.api.menu.onAction(handleMenuAction)
})

onUnmounted(() => {
  destroyHls()
  clearTimeout(controlsTimer)
  if (menuUnsubscribe) {
    menuUnsubscribe()
  }
})
</script>

<style scoped>
/* Volume slider styling */
.volume-slider::-webkit-slider-track {
  height: 4px;
  background-color: rgb(63 63 70);
  /* zinc-700 */
  border-radius: 9999px;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background-color: rgb(244 244 245);
  /* zinc-100 */
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 150ms;
}

.volume-slider::-webkit-slider-thumb:hover {
  background-color: rgb(255 255 255);
  /* white */
}

.volume-slider::-moz-range-track {
  height: 4px;
  background-color: rgb(63 63 70);
  /* zinc-700 */
  border-radius: 9999px;
}

.volume-slider::-moz-range-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background-color: rgb(244 244 245);
  /* zinc-100 */
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 150ms;
  border: 0;
}

.volume-slider::-moz-range-thumb:hover {
  background-color: rgb(255 255 255);
  /* white */
}
</style>