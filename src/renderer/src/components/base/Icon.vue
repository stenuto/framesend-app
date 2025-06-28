<template>
  <component :is="iconComponent" v-if="iconComponent" :class="$attrs.class" />
  <span v-else class="inline-flex items-center justify-center text-gray-400 leading-none">?</span>
</template>

<script setup>
import { computed } from 'vue'
import * as RadixIcons from '@radix-icons/vue'

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
    .join('') + 'Icon'
})

// Get the icon component from RadixIcons
const iconComponent = computed(() => {
  return RadixIcons[iconName.value] || null
})
</script>