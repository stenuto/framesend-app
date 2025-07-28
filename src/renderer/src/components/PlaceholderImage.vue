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

onMounted(() => {
  // Use Picsum's seed URL for consistent images
  // The seed parameter ensures the same image loads every time for the same seed
  imageUrl.value = `https://picsum.photos/seed/${props.seed}/640/360`
})
</script>