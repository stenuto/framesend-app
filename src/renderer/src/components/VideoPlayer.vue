<template>
<div class="w-full bg-black flex items-center justify-center">
  <hls-video
    v-if="manifestUrl"
    :src="manifestUrl"
    controls
    muted
    class="w-full h-full object-contain"
    :key="manifestUrl" />
  <div v-else class="text-zinc-500 text-sm">
    Video not available
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import 'hls-video-element'

const props = defineProps({
  videoId: {
    type: String,
    required: true
  },
  jobId: {
    type: String,
    required: true
  }
})

// Compute the local path to the master.m3u8 file
const manifestPath = computed(() => {
  if (!props.jobId) return null

  // Use the job ID to construct the path
  // The encoding output is stored in the app data directory
  // We'll get the full path via IPC
  return null // Will be set by getManifestPath
})

const manifestUrl = ref(null)

// Get the actual file path from the main process
const getManifestPath = () => {
  if (!props.jobId) return

  // Try to get username from current user environment
  // This is a temporary solution until app:getPath handler is loaded
  const pathParts = window.location.pathname.split('/')
  let username = 'stephentenuto' // fallback

  // Try to extract from file path
  if (pathParts.includes('Users') && pathParts.length > pathParts.indexOf('Users') + 1) {
    username = pathParts[pathParts.indexOf('Users') + 1]
  }

  const basePath = `/Users/${username}/Library/Application Support/framesend-app`
  const fullPath = `${basePath}/encoded-videos/${props.jobId}/master.m3u8`

  // For HLS to work properly, we need to use file:// protocol
  manifestUrl.value = `file://${fullPath}`
  console.log('Video manifest URL:', manifestUrl.value)
}

// Watch for jobId changes
watch(() => props.jobId, () => {
  getManifestPath()
}, { immediate: true })

// Log the manifest path for debugging
watch(manifestPath, (newPath) => {
  console.log('Video manifest path:', newPath)
})

onMounted(() => {
  console.log('VideoPlayer mounted with jobId:', props.jobId)
})
</script>