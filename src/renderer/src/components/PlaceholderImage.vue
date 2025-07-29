<template>
<div class="w-full h-full"></div>
</template>

<script setup>
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
</script>