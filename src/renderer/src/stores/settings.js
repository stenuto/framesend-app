import { defineStore } from 'pinia'
import { ref, watch, toRaw, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State - all settings in one object
  const settings = ref({
    general: {
      // Removed appearance - dark mode only
    },
    encoding: {
      customRungs: [
        {
          id: '360p_default1',
          height: 360,
          quality: 2,
          enabled: true
        },
        {
          id: '720p_default2',
          height: 720,
          quality: 3,
          enabled: true
        },
        {
          id: '1080p_default3',
          height: 1080,
          quality: 3,
          enabled: true
        },
        {
          id: '2160p_default4',
          height: 2160,
          quality: 3,
          enabled: false
        }
      ],
      hardwareAcceleration: {
        enabled: true
      },
      streamingPreset: 'balanced',
      audioEnhancement: {
        enabled: true,
        level: 3
      }
    },
    projects: {
      order: [] // Array of project IDs in custom order
    },
    ui: {
      viewMode: 'list' // 'list' or 'gallery'
    }
  })
  
  const isLoading = ref(true)
  
  
  // Actions
  async function loadSettings() {
    try {
      const loaded = await window.api.settings.load()
      if (loaded) {
        // Deep merge loaded settings with defaults to ensure all properties exist
        settings.value = {
          general: {
            ...settings.value.general,
            ...loaded.general
          },
          encoding: {
            ...settings.value.encoding,
            ...loaded.encoding,
            // Use loaded customRungs if available, otherwise use defaults
            customRungs: loaded.encoding?.customRungs || settings.value.encoding.customRungs,
            hardwareAcceleration: {
              ...settings.value.encoding.hardwareAcceleration,
              ...loaded.encoding?.hardwareAcceleration
            },
            audioEnhancement: {
              ...settings.value.encoding.audioEnhancement,
              ...loaded.encoding?.audioEnhancement
            }
          },
          projects: {
            order: loaded.projects?.order || [],
            ...loaded.projects
          },
          ui: {
            ...settings.value.ui,
            ...loaded.ui
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      isLoading.value = false
      // Theme application removed - dark mode only
    }
  }
  
  async function saveSettings() {
    try {
      // Extract plain object from Vue reactive proxy and ensure deep serialization
      const rawSettings = JSON.parse(JSON.stringify(toRaw(settings.value)))
      await window.api.settings.save(rawSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  // Appearance update removed - dark mode only
  
  // Theme application removed - dark mode only
  
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
  
  // View mode helpers
  const viewMode = computed({
    get: () => settings.value.ui?.viewMode || 'list',
    set: (mode) => {
      if (!settings.value.ui) {
        settings.value.ui = {}
      }
      settings.value.ui.viewMode = mode
    }
  })
  
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
    updateProjectOrder,
    getProjectOrder,
    // Getters
    encodingSettings: () => settings.value.encoding,
    projectOrder: computed(() => settings.value.projects?.order || []),
    viewMode
  }
})