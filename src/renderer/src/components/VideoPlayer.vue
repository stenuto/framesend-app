<template>
  <div class="relative w-full aspect-video bg-white/10">
    <img src="https://videoflare.stenuto.workers.dev/api/videos/W42komAoK9/thumbnail_720p.jpg"
      class="w-full h-full object-cover">
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  }
})

// Extract video ID from the playlist URL
const videoId = computed(() => {
  // Handle both playlist URLs and direct watch URLs
  const match = props.src.match(/\/([^\/]+)\/playlist\.m3u8$/) ||
    props.src.match(/\/watch\/([^\/]+)$/);
  return match ? match[1] : 'W42komAoK9'; // fallback to default
})
</script>