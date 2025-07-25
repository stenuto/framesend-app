<template>
  <div class="flex gap-5 border-b border-black/10 dark:border-zinc-700/50 pb-8">
    <div class="w-1/3">
      <div>
        <h5 class="text-medium text-[13px]">
          {{ title }}
        </h5>
        <p v-if="description" class="text-xs text-current/50 leading-tight">
          {{ description }}
        </p>
      </div>
    </div>
    <div class="w-2/3">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsItem',
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  }
}
</script>