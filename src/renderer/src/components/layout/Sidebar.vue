<template>
  <div class="flex h-full w-64 flex-col shrink-0 border-r border-zinc-700 bg-zinc-900/30">
    <!-- Header -->
    <div class="flex h-9 items-center px-3 border-b border-zinc-700">
      <h2 class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Projects</h2>
    </div>

    <!-- Project List -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-2 space-y-1">
        <!-- Projects -->
        <div 
          v-for="project in projects" 
          :key="project.id"
          :class="[
            'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
            selectedProjectId === project.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
          ]"
          @click="handleProjectClick(project.id)"
        >
          <!-- Project Color Indicator -->
          <div 
            class="w-1 h-8 rounded-full shrink-0"
            :class="[
              project.color === 'cyan' && 'bg-cyan-500',
              project.color === 'purple' && 'bg-purple-500',
              project.color === 'green' && 'bg-green-500',
              project.color === 'orange' && 'bg-orange-500',
              project.color === 'pink' && 'bg-pink-500'
            ]"
          />
          
          <!-- Project Info -->
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-zinc-200 truncate">{{ project.name }}</h3>
            <p class="text-xs text-zinc-500">{{ project.videoCount }} videos</p>
          </div>
          
          <!-- Last Modified -->
          <span class="text-[11px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
            {{ formatDate(project.lastModified) }}
          </span>

        </div>
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

export default defineComponent({
  name: 'Sidebar',
  components: {
    Icon
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

    return {
      projects,
      selectedProjectId,
      handleProjectClick,
      formatDate
    }
  }
})
</script>