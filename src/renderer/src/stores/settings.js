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
  
  // Dark mode state
  const darkMode = ref(savedSettings.darkMode ?? false)
  
  // Other settings can be added here
  const sidebarCollapsed = ref(savedSettings.sidebarCollapsed ?? false)
  const accentColor = ref(savedSettings.accentColor ?? 'blue')

  // Save settings to localStorage whenever they change
  const saveSettings = () => {
    try {
      const settings = {
        darkMode: darkMode.value,
        sidebarCollapsed: sidebarCollapsed.value,
        accentColor: accentColor.value
      }
      localStorage.setItem('app-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Watch for changes and save
  watch([darkMode, sidebarCollapsed, accentColor], saveSettings)

  // Apply dark mode class to document
  const applyDarkMode = () => {
    if (darkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Apply dark mode on initialization
  applyDarkMode()

  // Toggle dark mode
  function toggleDarkMode() {
    darkMode.value = !darkMode.value
    applyDarkMode()
  }

  // Set dark mode
  function setDarkMode(value) {
    darkMode.value = value
    applyDarkMode()
  }

  return {
    // State
    darkMode,
    sidebarCollapsed,
    accentColor,
    
    // Actions
    toggleDarkMode,
    setDarkMode
  }
})