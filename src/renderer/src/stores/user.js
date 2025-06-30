import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // Mock user data for development
  const mockUser = {
    id: 'user-123',
    email: 'john.doe@example.com',
    name: 'John Doe',
    avatar: 'https://i.pravatar.cc/100?img=3',
    role: 'admin', // admin, member, viewer
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        inApp: true,
        desktop: true
      }
    },
    team: {
      id: 'team-456',
      name: 'Acme Studios',
      slug: 'acme-studios',
      logo: null,
      plan: 'pro', // free, pro, enterprise
      planDetails: {
        name: 'Pro',
        maxMembers: 10,
        maxFolders: -1, // unlimited
        maxStorageGB: 100,
        features: ['advanced-analytics', 'custom-branding', 'api-access', 'priority-support']
      },
      memberCount: 5,
      createdAt: new Date('2023-12-01'),
      owner: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john.doe@example.com'
      },
      subscription: {
        status: 'active', // active, canceled, past_due
        currentPeriodEnd: new Date('2025-01-01'),
        cancelAtPeriodEnd: false
      }
    }
  }

  // Getters
  const userInitials = computed(() => {
    if (!currentUser.value?.name) return '?'
    const parts = currentUser.value.name.split(' ')
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0]
    }
    return currentUser.value.name.slice(0, 2).toUpperCase()
  })

  const teamInitials = computed(() => {
    if (!currentUser.value?.team?.name) return '?'
    const parts = currentUser.value.team.name.split(' ')
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0]
    }
    return currentUser.value.team.name.slice(0, 2).toUpperCase()
  })

  const isTeamOwner = computed(() => {
    return currentUser.value?.id === currentUser.value?.team?.owner?.id
  })

  const isAdmin = computed(() => {
    return currentUser.value?.role === 'admin' || isTeamOwner.value
  })

  const canEditContent = computed(() => {
    return ['admin', 'member'].includes(currentUser.value?.role) || isTeamOwner.value
  })

  const isPlanActive = computed(() => {
    return currentUser.value?.team?.subscription?.status === 'active'
  })

  const teamPlan = computed(() => {
    return currentUser.value?.team?.plan || 'free'
  })

  // Actions
  async function login(_email, _password) {
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In real app, this would be an API call
      // For now, use mock data
      currentUser.value = mockUser
      isAuthenticated.value = true
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      currentUser.value = null
      isAuthenticated.value = false
      
      // Clear other stores if needed
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(updates) {
    if (!currentUser.value) return { success: false, error: 'Not authenticated' }
    
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      currentUser.value = {
        ...currentUser.value,
        ...updates
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  async function updateTeam(updates) {
    if (!currentUser.value?.team) return { success: false, error: 'No team found' }
    if (!isAdmin.value) return { success: false, error: 'Insufficient permissions' }
    
    isLoading.value = true
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      currentUser.value.team = {
        ...currentUser.value.team,
        ...updates
      }
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // Initialize with mock user for development
  function initializeMockUser() {
    currentUser.value = mockUser
    isAuthenticated.value = true
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    isLoading,
    
    // Getters
    userInitials,
    teamInitials,
    isTeamOwner,
    isAdmin,
    canEditContent,
    isPlanActive,
    teamPlan,
    
    // Actions
    login,
    logout,
    updateProfile,
    updateTeam,
    initializeMockUser
  }
})