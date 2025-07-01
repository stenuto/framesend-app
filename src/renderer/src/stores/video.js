import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVideoStore = defineStore('video', () => {
  // State
  const currentVideo = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const playbackRate = ref(1)
  
  // Recent videos for quick access
  const recentVideos = ref([])
  const maxRecentVideos = 10
  
  // Getters
  const hasVideo = computed(() => currentVideo.value !== null)
  
  const videoTitle = computed(() => {
    return currentVideo.value?.name || 'No video selected'
  })
  
  const videoPath = computed(() => {
    return currentVideo.value?.path || null
  })
  
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })
  
  const formattedCurrentTime = computed(() => {
    return formatTime(currentTime.value)
  })
  
  const formattedDuration = computed(() => {
    return formatTime(duration.value)
  })
  
  // Actions
  function selectVideo(video) {
    // Stop current playback if any
    if (isPlaying.value) {
      pause()
    }
    
    // Set new video
    currentVideo.value = video
    currentTime.value = 0
    isPlaying.value = false
    
    // Add to recent videos
    addToRecentVideos(video)
  }
  
  function clearVideo() {
    currentVideo.value = null
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
  }
  
  function play() {
    if (hasVideo.value) {
      isPlaying.value = true
    }
  }
  
  function pause() {
    isPlaying.value = false
  }
  
  function togglePlayback() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }
  
  function seek(time) {
    currentTime.value = Math.max(0, Math.min(time, duration.value))
  }
  
  function seekByPercent(percent) {
    const time = (percent / 100) * duration.value
    seek(time)
  }
  
  function setDuration(dur) {
    duration.value = dur
  }
  
  function updateCurrentTime(time) {
    currentTime.value = time
  }
  
  function setVolume(vol) {
    volume.value = Math.max(0, Math.min(1, vol))
    if (vol > 0) {
      isMuted.value = false
    }
  }
  
  function toggleMute() {
    isMuted.value = !isMuted.value
  }
  
  function setPlaybackRate(rate) {
    playbackRate.value = rate
  }
  
  function skipForward(seconds = 10) {
    seek(currentTime.value + seconds)
  }
  
  function skipBackward(seconds = 10) {
    seek(currentTime.value - seconds)
  }
  
  // Recent videos management
  function addToRecentVideos(video) {
    // Remove if already exists
    recentVideos.value = recentVideos.value.filter(v => v.id !== video.id)
    
    // Add to beginning
    recentVideos.value.unshift({
      ...video,
      lastPlayed: new Date()
    })
    
    // Keep only max recent
    if (recentVideos.value.length > maxRecentVideos) {
      recentVideos.value = recentVideos.value.slice(0, maxRecentVideos)
    }
  }
  
  function clearRecentVideos() {
    recentVideos.value = []
  }
  
  // Helper functions
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  return {
    // State
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    recentVideos,
    
    // Getters
    hasVideo,
    videoTitle,
    videoPath,
    progress,
    formattedCurrentTime,
    formattedDuration,
    
    // Actions
    selectVideo,
    clearVideo,
    play,
    pause,
    togglePlayback,
    seek,
    seekByPercent,
    setDuration,
    updateCurrentTime,
    setVolume,
    toggleMute,
    setPlaybackRate,
    skipForward,
    skipBackward,
    addToRecentVideos,
    clearRecentVideos
  }
})