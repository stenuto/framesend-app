import { defineStore } from 'pinia'
import { ref, watch, toRaw, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State - all settings in one object
  const settings = ref({
    general: {
      appearance: 'system' // 'system', 'light', 'dark'
    },
    encoding: {
      h264: {
        enabled: true,
        rungs: {
          '360p': true,
          '720p': true,
          '1080p': true,
          '2160p': true
        },
        quality: 3
      },
      av1: {
        enabled: false,
        rungs: {
          '2160p_hq': true
        },
        quality: 5
      }
    },
    projects: {
      order: [] // Array of project IDs in custom order
    }
  })
  
  const isLoading = ref(true)
  
  
  // Actions
  async function loadSettings() {
    try {
      const loaded = await window.api.settings.load()
      if (loaded) {
        // Merge loaded settings with defaults to ensure all properties exist
        settings.value = {
          ...settings.value,
          ...loaded,
          // Ensure projects object exists with loaded values
          projects: {
            order: loaded.projects?.order || [],
            ...loaded.projects
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      isLoading.value = false
      // Apply theme after loading
      applyTheme()
    }
  }
  
  async function saveSettings() {
    try {
      // Extract plain object from Vue reactive proxy
      const rawSettings = toRaw(settings.value)
      await window.api.settings.save(rawSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  function updateAppearance(appearance) {
    settings.value.general.appearance = appearance
    applyTheme()
  }
  
  function applyTheme() {
    const body = document.body
    const appearance = settings.value.general.appearance
    
    if (appearance === 'dark') {
      body.classList.add('dark')
    } else if (appearance === 'light') {
      body.classList.remove('dark')
    } else {
      // system - let Tailwind handle it (default behavior)
      body.classList.remove('dark')
    }
  }
  
  function updateProjectOrder(projectIds) {
    // Ensure projects object exists
    if (!settings.value.projects) {
      settings.value.projects = {}
    }
    settings.value.projects.order = projectIds
  }
  
  function getProjectOrder() {
    return settings.value.projects?.order || []
  }
  
  
  // Watch for settings changes and save
  watch(settings, () => {
    if (!isLoading.value) {
      saveSettings()
    }
  }, { deep: true })
  
  // Initialize
  loadSettings()
  
  return {
    // State
    settings,
    isLoading,
    // Actions
    loadSettings,
    saveSettings,
    updateAppearance,
    updateProjectOrder,
    getProjectOrder,
    // Getters
    appearance: () => settings.value.general.appearance,
    encodingSettings: () => settings.value.encoding,
    projectOrder: computed(() => settings.value.projects?.order || [])
  }
})