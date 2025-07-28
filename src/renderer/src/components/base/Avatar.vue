<template>
  <div :class="[
    'relative inline-flex items-center justify-center overflow-hidden',
    src ? '' : backgroundColor,
    sizeClasses[size],
    className
  ]">
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover">
    <span v-else :class="['font-medium text-white', textSizeClasses[size]]">
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

const backgroundColor = computed(() => {
  // List of Tailwind 500 colors for avatars
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
  ]
  
  // Generate a consistent color based on the name
  if (!props.name) return colors[0]
  
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
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
