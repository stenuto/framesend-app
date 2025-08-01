<template>
<div class="flex h-full w-60 flex-col shrink-0 border-r border-white/6">
  <div class="drag h-12 w-full shrink-0 items-center flex justify-end pr-3 gap-1.5 text-zinc-400/75">
    <Button icon-name="arrow-left" size="sm" variant="ghost" :disabled="!canGoBack" @click="router.goBack()" />
    <Button icon-name="arrow-right" size="sm" variant="ghost" :disabled="!canGoForward" @click="router.goForward()" />
    <!-- <Button icon-name="panel-right-open" size="sm" variant="ghost" @click="toggleSidebar" /> -->
  </div>

  <!-- Account Button -->
  <AccountButton type="team" :name="teamName" :subtitle="teamPlanDisplay"
    :avatar-url="teamAvatar"
    @click="handleTeamAccountClick" />

  <!-- Project List -->
  <div class="flex justify-between items-center group pl-5 pr-[19px] pt-2 mt-4">
    <div class="text-[11px] font-regular text-current/60">
      Projects
    </div>
    <Button class="group-hover:opacity-100 opacity-0 transition-opacity duration-50" icon-name="plus" size="sm"
      variant="ghost" @click="createProject" :title="`New Project (${isMac ? '⌘' : 'Ctrl'}+N)`" />
  </div>
  <div class="flex-1 overflow-y-auto" :class="{ 'dragging-active': !!draggedProjectId }">
    <div class="px-3 pb-3 space-y-0.5 relative">
      <!-- Drop zone at the start -->
      <div class="drop-zone h-3 -mb-2 relative" @dragover.prevent="handleDropZoneDragOver($event, 0)"
        @drop.prevent="handleDropZoneDrop($event, 0)" @dragleave="handleDropZoneDragLeave">
        <div v-if="dropZoneIndex === 0"
          class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 rounded-full animate-pulse" />
      </div>

      <!-- Projects -->
      <template v-for="(project, index) in orderedProjects" :key="project.id">

        <SidebarItem :name="project.name" icon-name="folder" :highlighted="isProjectHighlighted(project.id)"
          :item-id="project.id" :editing-item-id="editingProjectId" :enable-context-menu="true" :editable="true"
          :draggable="true" @click="handleProjectClick(project.id)"
          @context-menu="handleProjectContextMenu($event, project)" @rename="handleProjectRename"
          @set-editing-item="editingProjectId = $event" @drag-start="handleProjectDragStart"
          @drag-end="handleProjectDragEnd" @drag-over="({ event }) => event.preventDefault()"
          @drop="({ event }) => event.stopPropagation()" />

        <!-- Drop zone after each item -->
        <div class="drop-zone h-4 -my-2 relative" @dragover.prevent="handleDropZoneDragOver($event, index + 1)"
          @drop.prevent="handleDropZoneDrop($event, index + 1)" @dragleave="handleDropZoneDragLeave">
          <div v-if="dropZoneIndex === index + 1"
            class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 rounded-full animate-pulse" />
        </div>
      </template>
    </div>

    <!-- Divider -->
    <div class="border-t border-zinc-700/50 mx-3" />

    <!-- Additional Items -->
    <div class="p-3 space-y-0.5">
      <SidebarItem name="Analytics" icon-name="chart-no-axes-column" :highlighted="isQueueHighlighted" @click="goToQueue" />
      <!-- <SidebarItem name="Queue" icon-name="list" :highlighted="isQueueHighlighted" @click="goToQueue" /> -->
      <SidebarItem name="Settings" icon-name="settings" :highlighted="isSettingsHighlighted" @click="goToSettings" />

    </div>
  </div>

  <AccountButton type="user" :name="currentUser?.name || 'User'" :subtitle="currentUser?.role || 'Member'" :avatar-url="currentUser?.avatar || ''" @click="handleUserAccountClick" class="mb-3" />
</div>
</template>

<script>
import { computed, defineComponent, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { useRouterStore } from '@/stores/router'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { apiService } from '@/services/api'
import { useKeybinding } from '@/composables/useKeybinding'
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
    const settingsStore = useSettingsStore()
    const userStore = useUserStore()
    const { projects, selectedProjectId } = storeToRefs(projectsStore)
    const { currentPage, canGoBack, canGoForward, currentParams } = storeToRefs(router)
    const { selectProject } = projectsStore
    const { toggleSidebar } = uiStore
    const { updateProjectOrder } = settingsStore
    const { isLoading: settingsLoading, projectOrder } = storeToRefs(settingsStore)
    const { currentUser, storageUsedGB } = storeToRefs(userStore)

    // State for editing projects
    const editingProjectId = ref(null)
    const draggedProjectId = ref(null)
    const dropZoneIndex = ref(null)
    const dropZonePosition = ref(null) // 'before' or 'after'
    let unsubscribeMenu = null
    let dragLeaveTimeout = null

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

    // Watch for changes to projects list to ensure order stays valid
    watch(projects, (newProjects) => {
      // When projects change (e.g., loaded from API), ensure the order is still valid
      const currentOrder = projectOrder.value
      if (currentOrder && currentOrder.length > 0) {
        const validIds = newProjects.map(p => p.id)
        const hasInvalidIds = currentOrder.some(id => !validIds.includes(id))

        if (hasInvalidIds) {
          // Clean up the order by removing invalid IDs
          const cleanedOrder = currentOrder.filter(id => validIds.includes(id))

          // Add any new projects that aren't in the order
          newProjects.forEach(project => {
            if (!cleanedOrder.includes(project.id)) {
              cleanedOrder.push(project.id)
            }
          })

          updateProjectOrder(cleanedOrder)
        }
      }
    }, { deep: true })

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

    const goToQueue = () => {
      // Clear project selection when going to queue
      selectProject(null)
      router.navigateTo('queue')
    }

    const handleTeamAccountClick = async (e) => {
      const team = currentUser.value?.team
      if (!team) return

      // Calculate storage usage - use reactive value from user store
      const storageUsed = storageUsedGB.value || 0
      const storageLimit = team.planDetails?.maxStorageGB || 100
      const storagePercentage = Math.round((storageUsed / storageLimit) * 100)

      const menuTemplate = [
        {
          label: `${storageUsed.toFixed(1)} GB of ${storageLimit} GB used (${storagePercentage}%)`,
          enabled: false
        },
        {
          label: 'Upgrade Your Plan',
          action: 'team:upgrade'
        },
        { type: 'separator' },
        {
          label: 'Invite Team Members',
          action: 'team:invite'
        },
        {
          label: 'Team Settings',
          action: 'team:settings'
        },
        { type: 'separator' },
        {
          label: 'Sign Out',
          action: 'auth:signout'
        }
      ]

      // Get the button element for positioning
      const button = e.currentTarget || e.target
      const rect = button.getBoundingClientRect()

      await window.api.menu.showContext(menuTemplate, {
        x: Math.round(rect.left),
        y: Math.round(rect.bottom)
      })
    }

    const handleUserAccountClick = async (e) => {
      const menuTemplate = [
        {
          label: currentUser.value?.email || 'user@example.com',
          enabled: false
        },
        { type: 'separator' },
        {
          label: 'Account Settings',
          action: 'user:account'
        },
        { type: 'separator' },
        {
          label: 'Keyboard Shortcuts',
          action: 'user:shortcuts'
        },
        {
          label: 'Help & Documentation',
          action: 'user:help'
        },
        { type: 'separator' },
        {
          label: 'Sign Out',
          action: 'auth:signout'
        }
      ]

      // Get the button element for positioning
      const button = e.currentTarget || e.target
      const rect = button.getBoundingClientRect()

      await window.api.menu.showContext(menuTemplate, {
        x: Math.round(rect.left),
        y: Math.round(rect.top - 10) // Show above the button since it's at the bottom
      })
    }

    // Computed property to check if project is highlighted
    const isProjectHighlighted = (projectId) => {
      return selectedProjectId.value === projectId && currentPage.value === 'project-explorer'
    }

    // Computed property to check if settings is highlighted
    const isSettingsHighlighted = computed(() => {
      return currentPage.value === 'settings'
    })

    // Computed property to check if queue is highlighted
    const isQueueHighlighted = computed(() => {
      return currentPage.value === 'queue'
    })

    // Check if on Mac for keyboard shortcuts
    const isMac = computed(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0)

    // User and team computed properties
    const teamName = computed(() => currentUser.value?.team?.name || 'Team')
    const teamPlanDisplay = computed(() => {
      const plan = currentUser.value?.team?.planDetails?.name || currentUser.value?.team?.plan
      return plan ? `${plan} plan` : 'Free plan'
    })
    const teamAvatar = computed(() => currentUser.value?.team?.logo || '')

    // Computed property for ordered projects
    const orderedProjects = computed(() => {
      // Wait for settings to load
      if (settingsLoading.value) {
        return projects.value
      }

      const order = projectOrder.value

      if (!order || order.length === 0) {
        // No custom order, return projects as is
        return projects.value
      }

      // Create a map of projects by ID for quick lookup
      const projectMap = new Map()
      projects.value.forEach(p => projectMap.set(p.id, p))

      // Build ordered array
      const ordered = []

      // First add projects in the saved order
      order.forEach(id => {
        const project = projectMap.get(id)
        if (project) {
          ordered.push(project)
          projectMap.delete(id) // Remove from map to track what's been added
        }
      })

      // Then add any remaining projects not in the saved order (new projects)
      projectMap.forEach(project => {
        ordered.push(project)
      })

      // Clean up orphaned IDs in the saved order (projects that no longer exist)
      const validIds = projects.value.map(p => p.id)
      const cleanedOrder = order.filter(id => validIds.includes(id))
      if (cleanedOrder.length !== order.length) {
        // Update the saved order to remove orphaned IDs
        updateProjectOrder(ordered.map(p => p.id))
      }

      return ordered
    })

    // Handle project context menu
    const handleProjectContextMenu = async (e, project) => {
      const menuTemplate = [
        {
          label: 'Rename',
          action: 'project:rename',
          data: { projectId: project.id, projectName: project.name }
        },
        { type: 'separator' },
        {
          label: 'Delete',
          action: 'project:delete',
          data: { projectId: project.id, projectName: project.name },
          enabled: projects.value.length > 1 // Disable if only one project
        }
      ]

      await window.api.menu.showContext(menuTemplate, {
        x: e.clientX,
        y: e.clientY
      })
    }

    // Handle menu actions
    const handleMenuAction = async (action, data) => {
      switch (action) {
        case 'project:rename':
          editingProjectId.value = data.projectId
          break

        case 'project:delete':
          if (confirm(`Delete project "${data.projectName}"?\n\nThis action cannot be undone.`)) {
            const index = projects.value.findIndex(p => p.id === data.projectId)
            if (index !== -1) {
              // Store the project for potential rollback
              const deletedProject = { ...projects.value[index] }
              const originalOrder = [...projectOrder.value]

              // Optimistic update - remove from UI
              projects.value.splice(index, 1)

              // Update the saved order to remove the deleted project
              const currentOrder = projectOrder.value.filter(id => id !== data.projectId)
              updateProjectOrder(currentOrder)

              // If we deleted the selected project, select another one
              const wasSelected = selectedProjectId.value === data.projectId
              if (wasSelected) {
                const nextProject = projects.value[0]
                if (nextProject) {
                  selectProject(nextProject.id)
                  router.navigateTo('project-explorer', { projectId: nextProject.id })
                } else {
                  // No projects left, navigate to settings
                  goToSettings()
                }
              }

              console.log(`Project deleted: "${data.projectName}"`)

              try {
                // Call server to delete project
                await apiService.deleteProject(data.projectId)
              } catch (error) {
                console.error('Failed to delete project on server:', error)

                // Rollback - restore the project
                projects.value.splice(index, 0, deletedProject)
                updateProjectOrder(originalOrder)

                // Restore selection if needed
                if (wasSelected) {
                  selectProject(data.projectId)
                  router.navigateTo('project-explorer', { projectId: data.projectId })
                }

                // Show error to user
                alert('Failed to delete project. Please try again.')
              }
            }
          }
          break

        case 'team:upgrade':
          // Open upgrade page or modal
          console.log('Opening upgrade page...')
          // In a real app, this would navigate to upgrade page or open a modal
          alert('Upgrade functionality coming soon!')
          break

        case 'team:invite':
          // Open invite team members modal
          console.log('Opening invite team members...')
          alert('Team invite functionality coming soon!')
          break

        case 'team:settings':
          // Navigate to team settings
          console.log('Opening team settings...')
          router.navigateTo('settings/team')
          break

        case 'auth:signout':
          if (confirm('Are you sure you want to sign out?')) {
            const result = await userStore.logout()
            if (result.success) {
              // Navigate to signin page
              router.navigateTo('signin')
            } else {
              alert('Failed to sign out. Please try again.')
            }
          }
          break

        case 'user:account':
          // Navigate to account settings
          console.log('Opening account settings...')
          router.navigateTo('settings/account')
          break

        case 'user:shortcuts':
          // Show keyboard shortcuts modal or navigate to help
          console.log('Opening keyboard shortcuts...')
          alert('Keyboard Shortcuts:\n\n⌘/Ctrl + N - New Project\n⌘/Ctrl + , - Settings\n⌘/Ctrl + Q - Quit\n\nMore shortcuts coming soon!')
          break

        case 'user:help':
          // Open help documentation
          console.log('Opening help documentation...')
          // In a real app, this would open external docs or help center
          window.open('https://help.framesend.com', '_blank')
          break
      }
    }

    // Handle project rename
    const handleProjectRename = async ({ itemId, oldName, newName }) => {
      const project = projects.value.find(p => p.id === itemId)
      if (project) {
        // Check if this is a new project (untitled)
        const isNewProject = oldName === 'Untitled Project'

        // Optimistic update
        project.name = newName
        console.log(`Project renamed from "${oldName}" to "${newName}"`)
        editingProjectId.value = null

        // If it's a new project and we haven't navigated yet, navigate now
        if (isNewProject && currentPage.value !== 'project-explorer') {
          router.navigateTo('project-explorer', { projectId: project.id })
        }

        try {
          // Call server to update project
          await apiService.updateProject(itemId, {
            name: newName
          })
        } catch (error) {
          console.error('Failed to rename project on server:', error)

          // Rollback
          project.name = oldName

          // Show error to user
          alert('Failed to rename project. Please try again.')
        }
      }
    }

    // Create new project
    const createProject = async () => {
      const tempId = `temp_project_${Date.now()}`
      const newProject = {
        id: tempId,
        name: 'Untitled Project',
        createdAt: new Date(),
        fileCount: 0
      }

      // Optimistic update - add to projects array
      projects.value.unshift(newProject)

      // Update the order to include the new project at the beginning
      const currentOrder = orderedProjects.value.map(p => p.id)
      updateProjectOrder(currentOrder)

      // Select the new project but don't navigate yet
      selectProject(newProject.id)

      // Make it editable after a small delay to ensure DOM is ready
      await nextTick()
      requestAnimationFrame(() => {
        editingProjectId.value = tempId
      })

      try {
        // Call server to create project
        const serverProject = await apiService.createProject({
          name: newProject.name
        })

        // Update temporary ID with server ID
        const projectIndex = projects.value.findIndex(p => p.id === tempId)
        if (projectIndex !== -1 && serverProject) {
          // Check if we're currently editing this project
          const wasEditing = editingProjectId.value === tempId

          projects.value[projectIndex].id = serverProject.id

          // Update the saved order with the new server ID
          const updatedOrder = projectOrder.value.map(id => id === tempId ? serverProject.id : id)
          updateProjectOrder(updatedOrder)

          // Update selection if this is still the selected project
          if (selectedProjectId.value === tempId) {
            selectProject(serverProject.id)
            // Don't navigate yet if we're editing
            if (!wasEditing) {
              router.navigateTo('project-explorer', { projectId: serverProject.id })
            }
          }

          // Preserve editing state with new ID
          if (wasEditing) {
            editingProjectId.value = serverProject.id
          }
        }
      } catch (error) {
        console.error('Failed to create project on server:', error)

        // Rollback - remove the project
        const index = projects.value.findIndex(p => p.id === tempId)
        if (index !== -1) {
          projects.value.splice(index, 1)
        }

        // Reset order
        const rollbackOrder = projectOrder.value.filter(id => id !== tempId)
        updateProjectOrder(rollbackOrder)

        // Navigate to first project or settings
        const firstProject = projects.value[0]
        if (firstProject) {
          selectProject(firstProject.id)
          router.navigateTo('project-explorer', { projectId: firstProject.id })
        } else {
          goToSettings()
        }

        // Show error to user
        alert('Failed to create project. Please try again.')
        return
      }


      console.log('New project created:', newProject)
    }

    // Use keybinding composable for new project
    useKeybinding('file:new-project', () => {
      createProject()
    })

    // Set up menu action listener
    onMounted(() => {
      unsubscribeMenu = window.api.menu.onAction(handleMenuAction)
      // Project order will be applied once settings are loaded
    })

    onUnmounted(() => {
      if (unsubscribeMenu) {
        unsubscribeMenu()
      }
    })

    // Drag and drop handlers for projects
    const handleProjectDragStart = ({ event, itemId }) => {
      draggedProjectId.value = itemId
    }

    const handleProjectDragEnd = ({ event, itemId }) => {
      // Clear any pending timeouts
      clearTimeout(dragLeaveTimeout)

      // Clear drag state after a small delay to allow drop to process
      setTimeout(() => {
        draggedProjectId.value = null
        dropZoneIndex.value = null
      }, 0)
    }

    // New drop zone handlers
    const handleDropZoneDragOver = (e, index) => {
      if (!draggedProjectId.value) return

      // Clear any pending leave timeout
      clearTimeout(dragLeaveTimeout)

      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      dropZoneIndex.value = index
    }

    const handleDropZoneDragLeave = (e) => {
      // Add a small delay to prevent flickering when moving between zones
      clearTimeout(dragLeaveTimeout)
      dragLeaveTimeout = setTimeout(() => {
        dropZoneIndex.value = null
      }, 50)
    }

    const handleDropZoneDrop = (e, index) => {
      if (!draggedProjectId.value) return

      e.preventDefault()

      const currentOrder = orderedProjects.value.map(p => p.id)
      const draggedIndex = currentOrder.indexOf(draggedProjectId.value)

      if (draggedIndex === -1) return

      // Remove from current position
      currentOrder.splice(draggedIndex, 1)

      // Calculate new index accounting for removal
      let newIndex = index
      if (draggedIndex < index) {
        newIndex--
      }

      // Insert at new position
      currentOrder.splice(newIndex, 0, draggedProjectId.value)

      // Update settings
      updateProjectOrder(currentOrder)

      // Clear drag state
      draggedProjectId.value = null
      dropZoneIndex.value = null
    }


    return {
      projects,
      selectedProjectId,
      handleProjectClick,
      formatDate,
      goToSettings,
      goToQueue,
      handleTeamAccountClick,
      handleUserAccountClick,
      toggleSidebar,
      isProjectHighlighted,
      isSettingsHighlighted,
      isQueueHighlighted,
      canGoBack,
      canGoForward,
      router,
      currentParams,
      editingProjectId,
      handleProjectContextMenu,
      handleProjectRename,
      createProject,
      isMac,
      orderedProjects,
      handleProjectDragStart,
      handleProjectDragEnd,
      handleDropZoneDragOver,
      handleDropZoneDrop,
      handleDropZoneDragLeave,
      dropZoneIndex,
      draggedProjectId,
      settingsLoading,
      projectOrder,
      currentUser,
      teamName,
      teamPlanDisplay,
      teamAvatar
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

/* Drag and drop improvements */
.dragging-active :deep(.group[draggable="true"] > *) {
  /* Prevent pointer events on child elements during drag */
  pointer-events: none !important;
}

/* Smooth transitions for drop indicators */
.drop-indicator {
  transition: all 150ms ease-out;
  opacity: 0;
  animation: fadeIn 150ms ease-out forwards;
  position: relative;
  z-index: 10;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scaleX(0.8);
  }

  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

/* Drop zones styling */
.drop-zone {
  position: relative;
  z-index: 5;
  pointer-events: none;
}

.dragging-active .drop-zone {
  pointer-events: auto;
}

/* Ensure smooth layout */
:deep(.group[draggable="true"]) {
  position: relative;
  z-index: 1;
}
</style>