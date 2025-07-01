<template>
  <div :class="computedClasses">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'secondary', 'success', 'warning', 'danger', 'custom'].includes(value)
  },
  color: {
    type: String,
    default: 'zinc'
  },
  shade: {
    type: Number,
    default: 500
  },
  className: {
    type: String,
    default: ''
  }
})

const variantClasses = {
  default: 'bg-zinc-700 text-zinc-200',
  secondary: 'bg-blue-900 text-blue-200',
  success: 'bg-green-900 text-green-200',
  warning: 'bg-yellow-900 text-yellow-200',
  danger: 'bg-red-900 text-red-200'
}

// Create a map of color combinations for light (100) and medium (500) shades
const colorClassMap = {
  // Light shades (100)
  'red-100': 'bg-red-100 text-red-700',
  'blue-100': 'bg-blue-100 text-blue-700',
  'green-100': 'bg-green-100 text-green-700',
  'yellow-100': 'bg-yellow-100 text-yellow-700',
  'purple-100': 'bg-purple-100 text-purple-700',
  'orange-100': 'bg-orange-100 text-orange-700',
  'indigo-100': 'bg-indigo-100 text-indigo-700',
  'pink-100': 'bg-pink-100 text-pink-700',
  'teal-100': 'bg-teal-100 text-teal-700',
  'cyan-100': 'bg-cyan-100 text-cyan-700',
  'zinc-100': 'bg-zinc-100 text-zinc-700',
  'emerald-100': 'bg-emerald-100 text-emerald-700',
  'violet-100': 'bg-violet-100 text-violet-700',
  'fuchsia-100': 'bg-fuchsia-100 text-fuchsia-700',
  'rose-100': 'bg-rose-100 text-rose-700',
  'amber-100': 'bg-amber-100 text-amber-700',
  'lime-100': 'bg-lime-100 text-lime-700',
  'sky-100': 'bg-sky-100 text-sky-700',

  // Medium shades (500)
  'red-500': 'bg-red-500 text-white',
  'blue-500': 'bg-blue-500 text-white',
  'green-500': 'bg-green-500 text-white',
  'yellow-500': 'bg-yellow-500 text-white',
  'purple-500': 'bg-purple-500 text-white',
  'orange-500': 'bg-orange-500 text-white',
  'indigo-500': 'bg-indigo-500 text-white',
  'pink-500': 'bg-pink-500 text-white',
  'teal-500': 'bg-teal-500 text-white',
  'cyan-500': 'bg-cyan-500 text-white',
  'zinc-500': 'bg-zinc-500 text-white',
  'emerald-500': 'bg-emerald-500 text-white',
  'violet-500': 'bg-violet-500 text-white',
  'fuchsia-500': 'bg-fuchsia-500 text-white',
  'rose-500': 'bg-rose-500 text-white',
  'amber-500': 'bg-amber-500 text-white',
  'lime-500': 'bg-lime-500 text-white',
  'sky-500': 'bg-sky-500 text-white'
}

const computedClasses = computed(() => {
  const baseClasses = 'inline-flex items-center rounded-smooth leading-none px-1.5 py-1 text-xs'

  if (props.variant === 'custom') {
    // Use the pre-defined color class map
    const colorKey = `${props.color}-${props.shade}`
    const colorClasses = colorClassMap[colorKey] || 'bg-zinc-100 text-zinc-800'
    return `${baseClasses} ${colorClasses} ${props.className}`
  }

  // Use predefined variant classes
  return `${baseClasses} ${variantClasses[props.variant]} ${props.className}`
})
</script>
