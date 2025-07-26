<template>
  <img 
    v-if="imageUrl"
    :src="imageUrl" 
    :alt="alt"
    class="w-full h-full object-cover"
  />
  <div v-else class="w-full h-full bg-zinc-800 animate-pulse"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  seed: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'Thumbnail'
  }
})

const imageUrl = ref('')

onMounted(async () => {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?client_id=dk69oOESKog1rTbMpF4Lg1glz1wYNU8OfvwSuTLfaTk&query=people,portrait,person&w=640&h=360`
    )
    
    if (response.ok) {
      const data = await response.json()
      imageUrl.value = data.urls.small || data.urls.regular
    } else {
      // Fallback
      imageUrl.value = `https://source.unsplash.com/640x360/?people,portrait&sig=${props.seed}`
    }
  } catch (error) {
    console.error('Error fetching Unsplash image:', error)
    // Fallback
    imageUrl.value = `https://source.unsplash.com/640x360/?technology,abstract&sig=${props.seed}`
  }
})
</script>