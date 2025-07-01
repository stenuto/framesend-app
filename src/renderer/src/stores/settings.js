import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // Load settings from localStorage
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('app-settings')
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Failed to load settings:', error)
      return {}
    }
  }

  // Initialize state with saved settings
  const savedSettings = loadSettings()
  
  // Other settings can be added here
  const sidebarCollapsed = ref(savedSettings.sidebarCollapsed ?? false)
  const accentColor = ref(savedSettings.accentColor ?? 'amber')

  // Save settings to localStorage whenever they change
  const saveSettings = () => {
    try {
      const settings = {
        sidebarCollapsed: sidebarCollapsed.value,
        accentColor: accentColor.value
      }
      localStorage.setItem('app-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Watch for changes and save
  watch([sidebarCollapsed, accentColor], saveSettings)

  // No need to apply dark mode class anymore

  return {
    // State
    sidebarCollapsed,
    accentColor
  }
})