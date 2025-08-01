import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Default keybindings per platform
const DEFAULT_KEYBINDINGS = {
  darwin: [
    { id: 'app:preferences', label: 'Open Preferences', accelerator: 'Cmd+,', scope: 'window' },
    // new project
    { id: 'file:new-project', label: 'New Project', accelerator: 'Cmd+N', scope: 'window' },
    // new folder
    { id: 'file:new-folder', label: 'New Folder', accelerator: 'Cmd+Shift+N', scope: 'window' },
  ],
}

export const useKeybindingsStore = defineStore('keybindings', () => {
  // State
  const shortcuts = ref([])
  const loaded = ref(false)
  const errors = ref(new Map()) // Map of id -> error message

  // Getters
  const getByCategory = computed(() => {
    const categories = {
      app: [],
      file: [],
      edit: [],
      view: [],
      window: [],
      navigation: [],
      explorer: [],
      queue: [],
      playback: []
    }

    shortcuts.value.forEach(shortcut => {
      const category = shortcut.id.split(':')[0]
      if (categories[category]) {
        categories[category].push(shortcut)
      }
    })

    return categories
  })

  const getById = computed(() => {
    return (id) => shortcuts.value.find(s => s.id === id)
  })

  const getByAccelerator = computed(() => {
    return (accelerator) => shortcuts.value.find(s => s.accelerator === accelerator)
  })

  const hasConflict = computed(() => {
    return (accelerator, excludeId) => {
      return shortcuts.value.some(s =>
        s.accelerator === accelerator && s.id !== excludeId
      )
    }
  })

  // Actions
  async function load() {
    try {
      // Load saved keybindings from settings
      const saved = await window.api.keybindings.load()

      if (saved && saved.length > 0) {
        shortcuts.value = saved
      } else {
        // Use platform defaults
        const platform = await window.api.app.getPlatform()
        shortcuts.value = DEFAULT_KEYBINDINGS[platform] || DEFAULT_KEYBINDINGS.darwin
      }

      loaded.value = true

      // Sync with main process
      await _syncWithMain()
    } catch (error) {
      console.error('Failed to load keybindings:', error)
      // Fall back to defaults on error
      shortcuts.value = DEFAULT_KEYBINDINGS.darwin
      loaded.value = true
    }
  }

  async function add(shortcut) {
    // Validate
    if (!shortcut.id || !shortcut.label || !shortcut.accelerator) {
      throw new Error('Invalid shortcut: missing required fields')
    }

    // Check for duplicate ID
    if (shortcuts.value.some(s => s.id === shortcut.id)) {
      throw new Error(`Shortcut with ID "${shortcut.id}" already exists`)
    }

    // Add to store
    shortcuts.value.push({
      ...shortcut,
      scope: shortcut.scope || 'window'
    })

    // Persist and sync
    await _save()
    await _syncWithMain()
  }

  async function update(id, updates) {
    const index = shortcuts.value.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Shortcut with ID "${id}" not found`)
    }

    // Update shortcut
    shortcuts.value[index] = {
      ...shortcuts.value[index],
      ...updates,
      id // Ensure ID can't be changed
    }

    // Clear any errors for this shortcut
    errors.value.delete(id)

    // Persist and sync
    await _save()
    await _syncWithMain()
  }

  async function remove(id) {
    const index = shortcuts.value.findIndex(s => s.id === id)
    if (index === -1) {
      throw new Error(`Shortcut with ID "${id}" not found`)
    }

    // Remove from store
    shortcuts.value.splice(index, 1)

    // Clear any errors
    errors.value.delete(id)

    // Persist and sync
    await _save()
    await _syncWithMain()
  }

  async function reset() {
    // Reset to platform defaults
    const platform = await window.api.app.getPlatform()
    shortcuts.value = [...DEFAULT_KEYBINDINGS[platform] || DEFAULT_KEYBINDINGS.darwin]

    // Clear all errors
    errors.value.clear()

    // Persist and sync
    await _save()
    await _syncWithMain()
  }

  function setError(id, message) {
    errors.value.set(id, message)
  }

  function clearError(id) {
    errors.value.delete(id)
  }

  function clearAllErrors() {
    errors.value.clear()
  }

  // Private helpers
  async function _save() {
    try {
      // Convert to plain objects to avoid Vue proxy serialization issues
      const plainShortcuts = shortcuts.value.map(s => ({
        id: s.id,
        label: s.label,
        accelerator: s.accelerator,
        category: s.category,
        scope: s.scope,
        enabled: s.enabled
      }))
      await window.api.keybindings.save(plainShortcuts)
    } catch (error) {
      console.error('Failed to save keybindings:', error)
    }
  }

  async function _syncWithMain() {
    try {
      // Convert to plain objects to avoid Vue proxy serialization issues
      const plainShortcuts = shortcuts.value.map(s => ({
        id: s.id,
        label: s.label,
        accelerator: s.accelerator,
        category: s.category,
        scope: s.scope,
        enabled: s.enabled
      }))
      await window.api.keybindings.registerAll(plainShortcuts)
    } catch (error) {
      console.error('Failed to sync keybindings with main process:', error)
    }
  }

  return {
    // State
    shortcuts,
    loaded,
    errors,

    // Getters
    getByCategory,
    getById,
    getByAccelerator,
    hasConflict,

    // Actions
    load,
    add,
    update,
    remove,
    reset,
    setError,
    clearError,
    clearAllErrors,

    // Re-export defaults for settings UI
    DEFAULT_KEYBINDINGS
  }
})