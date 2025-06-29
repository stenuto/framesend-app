<template>
  <component :is="iconComponent" v-if="iconComponent" :class="$attrs.class" />
  <span v-else class="inline-flex items-center justify-center text-gray-400 leading-none">?</span>
</template>

<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

// Convert kebab-case to PascalCase for icon component name
const iconName = computed(() => {
  return props.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
})

// Get the icon component from lucide icons
const iconComponent = computed(() => {
  return icons[iconName.value] || null
})
</script>