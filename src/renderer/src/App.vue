<template>
  <div class="bg-zinc-50 dark:bg-zinc-800">
    <div class="fixed top-0 left-0 right-0 h-8.5 drag" />
    <div class="non-draggable h-dvh w-dvw pt-8.5 px-3 pb-3">
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

const router = useRouterStore()
const { currentComponent } = storeToRefs(router)

// Initialize routes on mount
onMounted(async () => {
  await router.registerRoutes()
})
</script>
