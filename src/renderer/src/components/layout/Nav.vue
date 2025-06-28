<template>
  <nav class="h-8.5 flex items-center border-b border-gray-200 bg-gray-400 w-full shrink-0 pl-24 items-center">
    <div class="flex items-center gap-2">
      <Icon name="home" class="text-gray-700" />
      <Icon name="folder" class="text-gray-700" />
      <Icon name="inbox" class="text-gray-700" />
      <Icon name="activity" class="text-gray-700" />
      <Icon name="settings" class="text-gray-700" />
      <Icon name="user" class="text-gray-700" />
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import Icon from '../base/Icon.vue'

const activeNav = ref('projects')
</script>

<style scoped>
nav {
  background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
}
</style>