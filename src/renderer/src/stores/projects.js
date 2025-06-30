import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref([
    {
      id: 'proj1',
      name: 'Video_Course_2024',
      icon: '📹',
      videoCount: 12
    },
    {
      id: 'proj2',
      name: 'Client_Projects',
      icon: '🎬',
      videoCount: 8
    },
    {
      id: 'proj3',
      name: 'YouTube_Channel',
      icon: '🎥',
      videoCount: 15
    },
    {
      id: 'proj4',
      name: 'Stock_Footage',
      icon: '📚',
      videoCount: 24
    },
    {
      id: 'proj5',
      name: 'Personal_Archive',
      icon: '📱',
      videoCount: 32
    }
  ])

  const activeProjectId = ref('proj1')

  const activeProject = computed(() => 
    projects.value.find(p => p.id === activeProjectId.value)
  )

  function setActiveProject(projectId) {
    activeProjectId.value = projectId
  }

  function updateProject(projectId, updates) {
    const index = projects.value.findIndex(p => p.id === projectId)
    if (index !== -1) {
      projects.value[index] = { ...projects.value[index], ...updates }
    }
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    setActiveProject,
    updateProject
  }
})