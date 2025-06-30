<template>
  <component :is="iconComponent" v-if="iconComponent" :class="$attrs.class" :size="iconSize" />
  <span v-else class="inline-flex items-center justify-center text-zinc-400 leading-none">?</span>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  }
})

const attrs = useAttrs()

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

// Parse size from Tailwind classes or use the size prop
const iconSize = computed(() => {
  // Check if we have a class attribute with size classes
  const classAttr = attrs.class || ''
  const sizeMatch = classAttr.match(/size-(\d+(?:\.\d+)?)/)?.[1]
  
  if (sizeMatch) {
    // Convert Tailwind size to pixels (size-4 = 1rem = 16px)
    return parseFloat(sizeMatch) * 4
  }
  
  return props.size
})
</script>