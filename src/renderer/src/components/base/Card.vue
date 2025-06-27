<template>
  <div :class="['rounded-lg border bg-white text-gray-950 shadow-sm', className]">
    <div
      v-if="$slots.header"
      class="border-b px-6 py-4"
    >
      <slot name="header" />
    </div>
    <div :class="['p-6', contentClass]">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="border-t px-6 py-4"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
  defineProps({
    className: {
      type: String,
      default: ''
    },
    contentClass: {
      type: String,
      default: ''
    }
  })
</script>
