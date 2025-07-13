<template>
  <div class="bg-zinc-50 dark:bg-zinc-800 flex flex-col h-dvh w-dvw">
    <div
      class=" h-8.5 drag shrink-0 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-around px-3">
      <div class="shrink-0"></div>
      <div class="flex-1 text-center text-sm font-medium"></div>
      <div>
        <Button icon-name="settings" variant="ghost" size="sm" @click="goToSettings" />
      </div>

    </div>
    <div class="non-draggable flex-1 p-3">
      <component :is="currentComponent" v-if="currentComponent" />
      <div v-else class="flex items-center justify-center h-full">
        <p class="text-zinc-500">
          Loading...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouterStore } from './stores/router'
import Button from '@components/base/Button.vue'

const router = useRouterStore()
const { currentComponent } = storeToRefs(router)

// Navigate to settings
const goToSettings = () => {
  router.navigateTo('settings')
}

// Initialize routes on mount
onMounted(async () => {
  await router.registerRoutes()
})
</script>
