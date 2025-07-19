<template>
  <div class="flex h-full w-60 flex-col shrink-0 bg-zinc-300/25 dark:bg-zinc-900/75">
    <div
      class="drag h-12 w-full shrink-0 items-center flex justify-end pr-3 gap-1.5 text-zinc-500/75 dark:text-zinc-400/75">
      <Button icon-name="arrow-left" size="sm" variant="ghost" :disabled="!canGoBack" @click="router.goBack()" />
      <Button icon-name="arrow-right" size="sm" variant="ghost" :disabled="!canGoForward" @click="router.goForward()" />
      <!-- <Button icon-name="panel-right-open" size="sm" variant="ghost" @click="toggleSidebar" /> -->
    </div>

    <!-- Account Button -->
    <AccountButton type="team" name="Motioncrafter" subtitle="Pro plan"
      :avatar-url="'data:image/jpeg;base64,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'"
      @click="handleAccountClick" />

    <!-- Project List -->
    <div class="text-[11px] font-regular px-6 mt-6 text-current/60">
      Projects
    </div>
    <div class="flex-1 overflow-y-auto">
      <div class="p-3 space-y-0.5">
        <!-- Projects -->
        <SidebarItem v-for="project in projects" :key="project.id" :name="project.name" icon-name="folder"
          :highlighted="isProjectHighlighted(project.id)" @click="handleProjectClick(project.id)" />
      </div>

      <!-- Divider -->
      <div class="border-t border-black/10 dark:border-zinc-700/50 mx-3" />

      <!-- Additional Items -->
      <div class="p-3 space-y-0.5">
        <SidebarItem name="Settings" icon-name="settings" :highlighted="isSettingsHighlighted" @click="goToSettings" />
      </div>
    </div>

    <AccountButton type="user" name="Steve Tenuto" subtitle="Admin"
      avatar-url="https://pbs.twimg.com/profile_images/1800308863977291777/wawcQz6k_400x400.jpg"
      @click="handleAccountClick" class="mb-3" />
  </div>
</template>

<script>
import { computed, defineComponent, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { useUIStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import Icon from '@components/base/Icon.vue'
import Button from '@components/base/Button.vue'
import AccountButton from '@components/base/AccountButton.vue'
import SidebarItem from '@components/base/SidebarItem.vue'
export default defineComponent({
  name: 'Sidebar',
  components: {
    Icon,
    Button,
    AccountButton,
    SidebarItem
  },
  setup() {
    const projectsStore = useProjectsStore()
    const router = useRouterStore()
    const uiStore = useUIStore()
    const { projects, selectedProjectId } = storeToRefs(projectsStore)
    const { currentPage, canGoBack, canGoForward, currentParams } = storeToRefs(router)
    const { selectProject } = projectsStore
    const { toggleSidebar } = uiStore

    // Watch for route changes to update project selection
    watch([currentPage, currentParams], ([page, params]) => {
      if (page === 'project-explorer' && params.projectId) {
        // Select the project from route params
        selectProject(params.projectId)
      } else if (page === 'project-explorer' && !params.projectId && projects.value.length > 0) {
        // If no projectId in params but we're on project-explorer, 
        // it might be from old navigation - select first project as fallback
        const firstProject = projects.value[0]
        if (firstProject && !selectedProjectId.value) {
          selectProject(firstProject.id)
        }
      }
    }, { immediate: true })

    const formatDate = (date) => {
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (days === 0) return 'Today'
      if (days === 1) return 'Yesterday'
      if (days < 7) return `${days}d ago`
      if (days < 30) return `${Math.floor(days / 7)}w ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }


    const handleProjectClick = (projectId) => {
      selectProject(projectId)
      router.navigateTo('project-explorer', { projectId })
    }

    const goToSettings = () => {
      // Clear project selection when going to settings
      selectProject(null)
      router.navigateTo('settings')
    }

    const handleAccountClick = () => {
      // Handle account button click (e.g., show account menu, switch accounts, etc.)
      console.log('Account button clicked')
    }

    // Computed property to check if project is highlighted
    const isProjectHighlighted = (projectId) => {
      return selectedProjectId.value === projectId && currentPage.value === 'project-explorer'
    }

    // Computed property to check if settings is highlighted
    const isSettingsHighlighted = computed(() => {
      return currentPage.value === 'settings'
    })

    return {
      projects,
      selectedProjectId,
      handleProjectClick,
      formatDate,
      goToSettings,
      handleAccountClick,
      toggleSidebar,
      isProjectHighlighted,
      isSettingsHighlighted,
      canGoBack,
      canGoForward,
      router,
      currentParams
    }
  }
})
</script>

<style scoped>
/* Disabled button styling */
button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>