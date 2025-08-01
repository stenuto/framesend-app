<template>
  <MainLayout>
    <component :is="currentComponent" v-if="currentComponent" />
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-slate-500">
        Loading...
      </p>
    </div>
  </MainLayout>
  <ToastNotifications />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouterStore } from './stores/router'
import { useProjectsStore } from './stores/projects'
import { useSettingsStore } from './stores/settings'
import { useAlertsStore } from './stores/alerts'
import { useKeybindingsStore } from './stores/keybindings'
import { useKeybinding } from './composables/useKeybinding'
import { apiService } from './services/api'
import MainLayout from './components/layout/MainLayout.vue'
import ToastNotifications from './components/ToastNotifications.vue'

const router = useRouterStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore() // Initialize settings store
const alertsStore = useAlertsStore()
const keybindingsStore = useKeybindingsStore()
const { currentComponent } = storeToRefs(router)

// Handle app-level keybindings
useKeybinding('app:preferences', () => {
  router.navigateTo('settings')
})

useKeybinding('app:quit', () => {
  window.api.window.close()
})

// Initialize routes on mount
onMounted(async () => {
  await router.registerRoutes()
  
  // Initialize keybindings
  await keybindingsStore.load()

  try {
    // 1. Load all projects from server
    const projects = await apiService.getProjects()
    
    // 2. Hydrate projects store with server data
    if (projects && projects.length > 0) {
      projectsStore.hydrateProjects(projects)
      
      // 3. Select first project and load its content
      const firstProject = projects[0]
      const content = await apiService.getProjectContent(firstProject.id)
      projectsStore.hydrateProjectContent(firstProject.id, content)
      
      // Navigate to the first project
      projectsStore.selectProject(firstProject.id)
      router.navigateTo('project-explorer', { projectId: firstProject.id })
    } else {
      // No projects from server, use local data as fallback
      const firstProject = projectsStore.projects[0]
      if (firstProject) {
        projectsStore.selectProject(firstProject.id)
        router.navigateTo('project-explorer', { projectId: firstProject.id })
      }
    }
  } catch (error) {
    console.error('Failed to load projects from server:', error)
    
    // Show warning alert
    alertsStore.warning(
      'Server Connection Failed',
      'Unable to connect to the server. Using local data instead.'
    )
    
    // Fall back to local data
    const firstProject = projectsStore.projects[0]
    if (firstProject) {
      projectsStore.selectProject(firstProject.id)
      router.navigateTo('project-explorer', { projectId: firstProject.id })
    }
  }
})
</script>
