<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="[
      'flex h-10 w-full rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
      'placeholder:text-zinc-500',
      'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    ]"
    v-bind="$attrs"
    @input="$emit('update:modelValue', $event.target.value)"
  >
</template>

<script setup>
  defineProps({
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    className: {
      type: String,
      default: ''
    }
  })

  defineEmits(['update:modelValue'])
</script>
