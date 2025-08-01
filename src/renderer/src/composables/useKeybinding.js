import { onMounted, onUnmounted } from 'vue'

/**
 * Composable for subscribing to keybinding events
 * @param {string} id - The keybinding ID to listen for
 * @param {Function} handler - The callback function to execute
 * @param {Object} options - Optional configuration
 * @param {boolean} options.enabled - Whether the keybinding is enabled (default: true)
 */
export function useKeybinding(id, handler, options = {}) {
  const { enabled = true } = options
  
  let cleanup = null

  onMounted(() => {
    if (!enabled || !id || !handler) return

    // Subscribe to the keybinding event
    cleanup = window.ipc.on(`keybinding:${id}`, handler)
  })

  onUnmounted(() => {
    // Clean up the subscription
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  })

  // Return a manual cleanup function if needed
  return () => {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  }
}

/**
 * Composable for subscribing to multiple keybindings
 * @param {Object} bindings - Object mapping IDs to handlers
 * @param {Object} options - Optional configuration
 */
export function useKeybindings(bindings, options = {}) {
  const cleanups = []

  onMounted(() => {
    // Subscribe to all keybindings
    for (const [id, handler] of Object.entries(bindings)) {
      if (handler && typeof handler === 'function') {
        const cleanup = window.ipc.on(`keybinding:${id}`, handler)
        cleanups.push(cleanup)
      }
    }
  })

  onUnmounted(() => {
    // Clean up all subscriptions
    cleanups.forEach(cleanup => cleanup())
    cleanups.length = 0
  })

  // Return a manual cleanup function if needed
  return () => {
    cleanups.forEach(cleanup => cleanup())
    cleanups.length = 0
  }
}