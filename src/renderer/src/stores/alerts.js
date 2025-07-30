import { defineStore } from 'pinia'
import { ref, readonly, computed } from 'vue'

export const useAlertsStore = defineStore('alerts', () => {
  // State
  const alerts = ref([])
  let nextId = 1
  
  // Auto-dismiss durations (in milliseconds)
  const AUTO_DISMISS_DURATIONS = {
    success: 4000,  // 4 seconds
    warning: 5000,  // 5 seconds
    info: 4000,     // 4 seconds
    error: null     // No auto-dismiss for errors
  }

  // Add an alert
  function add(alert) {
    const id = nextId++
    const timestamp = new Date()
    
    const newAlert = {
      id,
      type: alert.type || 'info', // error, warning, success, info
      title: alert.title || '',
      message: alert.message || '',
      details: alert.details || null, // For error stack traces or additional info
      actions: alert.actions || [], // Array of { label, handler }
      timestamp,
      dismissible: alert.dismissible !== false, // Default true
      duration: alert.duration || AUTO_DISMISS_DURATIONS[alert.type || 'info']
    }
    
    alerts.value.push(newAlert)
    
    // Auto-dismiss if duration is set
    if (newAlert.duration) {
      setTimeout(() => {
        dismiss(id)
      }, newAlert.duration)
    }
    
    return id
  }
  
  // Dismiss an alert
  function dismiss(id) {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      alerts.value.splice(index, 1)
    }
  }
  
  // Clear all alerts of a specific type
  function clearType(type) {
    alerts.value = alerts.value.filter(a => a.type !== type)
  }
  
  // Clear all alerts
  function clearAll() {
    alerts.value = []
  }
  
  // Helper methods for common alert types
  function error(title, message, details = null) {
    return add({
      type: 'error',
      title,
      message,
      details
    })
  }
  
  function success(title, message) {
    return add({
      type: 'success',
      title,
      message
    })
  }
  
  function warning(title, message) {
    return add({
      type: 'warning',
      title,
      message
    })
  }
  
  function info(title, message) {
    return add({
      type: 'info',
      title,
      message
    })
  }
  
  // Get alerts by type
  const errors = computed(() => alerts.value.filter(a => a.type === 'error'))
  const warnings = computed(() => alerts.value.filter(a => a.type === 'warning'))
  const successes = computed(() => alerts.value.filter(a => a.type === 'success'))
  
  return {
    // State
    alerts: readonly(alerts),
    errors,
    warnings, 
    successes,
    
    // Actions
    add,
    dismiss,
    clearType,
    clearAll,
    
    // Helper methods
    error,
    success,
    warning,
    info
  }
})