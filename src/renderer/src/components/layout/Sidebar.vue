<template>
  <div class="flex h-full w-64 flex-col shrink-0 pt-6">

    <div class="flex items-center gap-2.5 mx-3 p-2 rounded-smooth-lg mt-4 hover:bg-zinc-700/50 cursor-pointer">
      <img src="https://placehold.co/100" alt="Framesend" class="size-8 rounded-smooth-md" />
      <div class="flex gap-2.5 items-center">
        <div class="flex flex-col gap-1 leading-none">
          <div class="text-base font-medium text-zinc-200 leading-none">Framesend</div>
          <div class="text-xs font-regular text-zinc-500 leading-none">Business</div>
        </div>

      </div>
      <div class="flex-1 flex justify-end">
        <Icon name="chevrons-up-down" class="size-3.5 text-zinc-500" />
      </div>
    </div>

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

    <!-- Settings Button at Bottom -->
    <div class="p-3 border-t border-zinc-700">
      <div @click="goToSettings" class="flex items-center gap-2 px-3 py-2 rounded-smooth-lg hover:bg-zinc-700 cursor-pointer">
        <Icon name="cog-6-tooth" class="w-4 h-4 text-zinc-400" />
        <span class="text-sm text-zinc-300">Settings</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { storeToRefs } from 'pinia'
import Icon from '@components/base/Icon.vue'
import Button from '@components/base/Button.vue'
export default defineComponent({
  name: 'Sidebar',
  components: {
    Icon,
    Button
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

    return {
      projects,
      selectedProjectId,
      handleProjectClick,
      formatDate,
      goToSettings
    }
  }
})
</script>