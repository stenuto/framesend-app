<template>
  <MainLayout>
    <component :is="currentComponent" v-if="currentComponent" />
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-slate-500">
        Loading...
      </p>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouterStore } from './stores/router'
import { useProjectsStore } from './stores/projects'
import { useSettingsStore } from './stores/settings'
import MainLayout from './components/layout/MainLayout.vue'

const router = useRouterStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore() // Initialize settings store
const { currentComponent } = storeToRefs(router)

// Initialize routes on mount
onMounted(async () => {
  await router.registerRoutes()

  // Navigate to the first project using proper navigation
  const firstProject = projectsStore.projects[0]
  if (firstProject) {
    projectsStore.selectProject(firstProject.id)
    // Use navigateTo with params to properly record in history
    router.navigateTo('project-explorer', { projectId: firstProject.id })
  }
})
</script>
