<template>
  <MainLayout>
    <component :is="currentComponent" v-if="currentComponent" />
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-zinc-500">
        Loading...
      </p>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouterStore } from './stores/router'
import MainLayout from './components/layout/MainLayout.vue'

const router = useRouterStore()
const { currentComponent } = storeToRefs(router)

// Initialize routes on mount
onMounted(async () => {
  await router.registerRoutes()
})
</script>
