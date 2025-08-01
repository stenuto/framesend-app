<template><label class="relative inline-flex items-center cursor-pointer">
  <input
    type="checkbox"
    :checked="modelValue"
    @change="$emit('update:modelValue', $event.target.checked)"
    class="sr-only peer">
  <div :class="[
    'bg-zinc-700 peer-focus:outline-none rounded-full peer',
    'peer-checked:after:border-white',
    'after:content-[\'\'] after:absolute after:bg-white after:rounded-full after:transition-all',
    'peer-checked:bg-blue-600',
    sizeClasses.track,
    sizeClasses.thumb
  ]"></div>
</label></template>

<script>
import { computed } from 'vue'

export default {
  name: 'ToggleSwitch',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    }
  },
  emits: ['update:modelValue'],
  setup(props) {
    const sizeClasses = computed(() => {
      const sizes = {
        sm: {
          track: 'w-4.5 h-2.5',
          thumb: 'after:h-2 after:w-2 after:top-[1px] after:left-[1px] peer-checked:after:translate-x-1.5'
        },
        md: {
          track: 'w-5.5 h-3.5',
          thumb: 'after:h-2.5 after:w-2.5 after:top-[2px] after:left-[2px] peer-checked:after:translate-x-2'
        },
        lg: {
          track: 'w-7 h-4.5',
          thumb: 'after:h-3.5 after:w-3.5 after:top-[2px] after:left-[2px] peer-checked:after:translate-x-2.5'
        }
      }
      return sizes[props.size] || sizes.md
    })

    return {
      sizeClasses
    }
  }
}
</script>