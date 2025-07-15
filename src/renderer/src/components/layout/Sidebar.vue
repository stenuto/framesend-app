<template>
  <div class="flex h-full w-64 flex-col shrink-0 pt-6">

    <!-- Account Button -->
    <AccountButton type="team" name="Framesend" subtitle="Pro plan" :avatar-url="'https://placehold.co/100'"
      @click="handleAccountClick" class="mt-4" />

    <!-- Project List -->
    <div class="text-xs font-regular text-zinc-500 px-5 mt-6">
      Projects
    </div>
    <div class="flex-1 overflow-y-auto">
      <div class="p-2 space-y-1">
        <!-- Projects -->
        <div v-for="project in projects" :key="project.id" :class="[
          'group flex items-center gap-2 px-3 py-2 rounded-smooth-lg cursor-pointer',
          selectedProjectId === project.id ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-700'
        ]" @click="handleProjectClick(project.id)">

          <!-- Project Info -->
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-zinc-200 truncate">{{ project.name }}</h3>
          </div>

          <!-- Last Modified -->
          <span class="text-[11px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {{ formatDate(project.lastModified) }}
          </span>

        </div>
      </div>
    </div>

    <AccountButton type="user" name="Steve Tenuto" subtitle="Admin"
      avatar-url="https://pbs.twimg.com/profile_images/1800308863977291777/wawcQz6k_400x400.jpg"
      @click="handleAccountClick" class="mb-3" />
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { storeToRefs } from 'pinia'
import Icon from '@components/base/Icon.vue'
import Button from '@components/base/Button.vue'
import AccountButton from '@components/base/AccountButton.vue'
export default defineComponent({
  name: 'Sidebar',
  components: {
    Icon,
    Button,
    AccountButton
  },
  setup() {
    const projectsStore = useProjectsStore()
    const router = useRouterStore()
    const { projects, selectedProjectId } = storeToRefs(projectsStore)
    const { selectProject } = projectsStore

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
      router.navigateTo('project-explorer')
    }

    const goToSettings = () => {
      router.navigateTo('settings')
    }

    const handleAccountClick = () => {
      // Handle account button click (e.g., show account menu, switch accounts, etc.)
      console.log('Account button clicked')
    }

    return {
      projects,
      selectedProjectId,
      handleProjectClick,
      formatDate,
      goToSettings,
      handleAccountClick
    }
  }
})
</script>