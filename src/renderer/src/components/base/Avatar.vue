<template>
  <div :class="[
    'relative inline-flex items-center justify-center overflow-hidden bg-zinc-700',
    sizeClasses[size],
    className
  ]">
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover">
    <span v-else :class="['font-medium text-zinc-300', textSizeClasses[size]]">
      {{ initials }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['sm', 'default', 'lg'].includes(value)
  },
  className: {
    type: String,
    default: ''
  }
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return props.name.slice(0, 2).toUpperCase()
})

const sizeClasses = {
  xs: 'size-5',
  sm: 'h-8 w-8',
  default: 'h-10 w-10',
  lg: 'h-12 w-12'
}

const textSizeClasses = {
  sm: 'text-xs',
  default: 'text-sm',
  lg: 'text-base'
}
</script>
