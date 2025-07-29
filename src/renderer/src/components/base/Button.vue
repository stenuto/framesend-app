<template><button :class="[
  'inline-flex items-center justify-center whitespace-nowrap rounded-smooth font-medium text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  variantClasses[variant],
  // Use icon-only size classes if only icon exists, otherwise regular size classes
  iconName && !hasDefaultSlot && !chevron ? iconOnlySizeClasses[size] : sizeClasses[size],
  className
]" :disabled="disabled" v-bind="$attrs">
  <Icon v-if="iconName" :name="iconName" :class="iconClasses" />
  <slot />
  <Icon v-if="chevron && hasDefaultSlot" name="chevron-down" :class="chevronClasses" />
</button></template>

<script setup>
import { computed, useSlots, Comment } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'].includes(value)
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'sm', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  iconName: {
    type: String,
    default: null
  },
  chevron: {
    type: Boolean,
    default: false
  },
  className: {
    type: String,
    default: ''
  }
})

const slots = useSlots()
const hasDefaultSlot = computed(() => {
  if (!slots.default) return false
  const vnodes = slots.default()
  return vnodes.some(vnode => {
    // Check if it's not a comment and has actual content
    if (vnode.type === Comment) return false
    if (typeof vnode.children === 'string') return vnode.children.trim().length > 0
    return true
  })
})

const variantClasses = {
  default: 'bg-zinc-700/50 text-zinc-100 hover:bg-zinc-600 ring-1 ring-white/10',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
  secondary: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
  ghost: 'bg-transparent hover:bg-white/7 hover:text-zinc-50',
  link: 'text-zinc-100 underline-offset-4 hover:underline'
}

const sizeClasses = {
  default: 'h-7 px-2 text-sm',
  sm: 'h-5 px-1.5 text-xs',
  lg: 'h-8 px-3 text-base'
}

// Override size classes for icon-only buttons (make them square)
const iconOnlySizeClasses = {
  sm: 'size-5',
  default: 'size-7',
  lg: 'size-8'
}

// Icon classes based on whether there's text or not
const iconClasses = computed(() => {
  // Properly scale icon based on button size
  const sizeClass = props.size === 'sm' ? 'size-3.5' : props.size === 'lg' ? 'size-5' : 'size-4'
  const marginClass = hasDefaultSlot.value ? (props.size === 'sm' ? 'mr-1' : 'mr-2') : ''
  return `${sizeClass} ${marginClass}`
})

// Chevron classes - smaller than main icon and with left margin
const chevronClasses = computed(() => {
  const sizeClass = props.size === 'sm' ? 'size-3' : props.size === 'lg' ? 'size-4' : 'size-3.5'
  const marginClass = props.size === 'sm' ? 'ml-1' : 'ml-1.5'
  return `${sizeClass} ${marginClass}`
})
</script>