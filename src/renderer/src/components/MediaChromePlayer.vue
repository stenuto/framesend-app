<template>
  <div 
    class="relative bg-zinc-850 h-full w-full"
    @contextmenu.prevent="handleContextMenu"
  >
    <media-controller class="h-full w-full">
      <hls-video
        ref="videoEl"
        slot="media"
        :src="manifestUrl"
        :class="['w-full h-full', props.fitMode === 'cover' ? 'object-cover' : 'object-contain']"
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @volumechange="handleVolumeChange"
        crossorigin
        playsinline
      />
      
      <!-- Loading indicator -->
      <media-loading-indicator 
        slot="centered-chrome" 
        noautohide
        v-if="loading"
      />
      
      <!-- Error state -->
      <div 
        v-if="error"
        slot="centered-chrome"
        class="flex flex-col items-center gap-2 text-center px-4"
      >
        <Icon name="video-off" class="w-8 h-8 text-zinc-500" />
        <p class="text-sm text-zinc-400">{{ error }}</p>
      </div>
      
      <!-- Control bar -->
      <media-control-bar v-if="!loading && !error">
        <media-play-button></media-play-button>
        <media-seek-backward-button seek-offset="10"></media-seek-backward-button>
        <media-seek-forward-button seek-offset="10"></media-seek-forward-button>
        <media-time-range></media-time-range>
        <media-time-display show-duration></media-time-display>
        <media-mute-button></media-mute-button>
        <media-volume-range></media-volume-range>
        <media-playback-rate-button rates="0.5 1 1.5 2"></media-playback-rate-button>
        <media-rendition-menu-button></media-rendition-menu-button>
        <media-fullscreen-button></media-fullscreen-button>
      </media-control-bar>
    </media-controller>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useKeybindings } from '@/composables/useKeybinding'
import Icon from '@/components/base/Icon.vue'
import 'media-chrome'
import 'hls-video-element'

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

// State
const loading = ref(true)
const error = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(100)
const isMuted = ref(false)

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
const handleLoadedMetadata = () => {
  if (!videoEl.value) return
  duration.value = videoEl.value.duration
  loading.value = false
}

const handleTimeUpdate = () => {
  if (!videoEl.value || !duration.value) return
  currentTime.value = videoEl.value.currentTime
}

const handleVolumeChange = () => {
  if (!videoEl.value) return
  
  isMuted.value = videoEl.value.muted
  if (!videoEl.value.muted) {
    volume.value = Math.round(videoEl.value.volume * 100)
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

const adjustVolume = (delta) => {
  if (!videoEl.value) return
  
  const newVolume = Math.max(0, Math.min(100, volume.value + delta))
  volume.value = newVolume
  videoEl.value.volume = newVolume / 100
  videoEl.value.muted = false
  isMuted.value = false
}

const toggleFullscreen = async () => {
  const container = videoEl.value?.parentElement?.parentElement // media-controller element
  if (!container) return
  
  if (!document.fullscreenElement) {
    await container.requestFullscreen()
  } else {
    await document.exitFullscreen()
  }
}

// Context menu handling
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

// Watch for manifest URL changes
watch(manifestUrl, (newUrl) => {
  if (newUrl && videoEl.value) {
    loading.value = true
    error.value = null
  }
})

// Handle HLS errors
watch(() => videoEl.value, (el) => {
  if (el) {
    el.addEventListener('error', (e) => {
      console.error('Video error:', e)
      loading.value = false
      error.value = 'Failed to load video'
    })
  }
})

// Lifecycle
let menuUnsubscribe = null

onMounted(() => {
  menuUnsubscribe = window.api.menu.onAction(handleMenuAction)
})

onUnmounted(() => {
  if (menuUnsubscribe) {
    menuUnsubscribe()
  }
})
</script>

<style>
/* Media Chrome background styling */
media-controller {
  --media-control-background: rgb(39 39 42); /* zinc-850 */
  --media-control-hover-background: rgb(63 63 70); /* zinc-700 */
  --media-text-color: rgb(228 228 231); /* zinc-200 */
  --media-secondary-color: rgb(161 161 170); /* zinc-400 */
  --media-primary-color: rgb(59 130 246); /* blue-500 */
}

/* Hide loading indicator when not needed */
media-loading-indicator[aria-hidden="true"] {
  display: none;
}
</style>