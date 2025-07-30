<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-3"
      >
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="toast-item pointer-events-auto max-w-md w-96"
        >
          <div
            class="relative overflow-hidden rounded-smooth-lg shadow-xl ring-1 backdrop-blur-sm"
            :class="[
              getAlertClasses(alert.type),
              alert.dismissible ? 'pr-10' : ''
            ]"
            @mouseenter="pauseAutoDismiss(alert)"
            @mouseleave="resumeAutoDismiss(alert)"
          >
            <!-- Progress bar for auto-dismiss -->
            <div
              v-if="alert.duration && !pausedAlerts.has(alert.id)"
              class="absolute top-0 left-0 h-0.5 bg-white/20 transition-all duration-300"
              :style="{
                width: `${getProgress(alert)}%`,
                transitionDuration: `${alert.duration}ms`
              }"
            />

            <!-- Content -->
            <div class="p-4 flex gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0 mt-0.5">
                <Icon
                  :name="getAlertIcon(alert.type)"
                  class="size-5"
                  :class="getIconClasses(alert.type)"
                  :stroke-width="2"
                />
              </div>

              <!-- Text content -->
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-zinc-100 mb-0.5">
                  {{ alert.title }}
                </h3>
                <p v-if="alert.message" class="text-[13px] text-zinc-300/90 leading-relaxed">
                  {{ alert.message }}
                </p>
                
                <!-- Details (collapsible for errors) -->
                <div v-if="alert.details && alert.type === 'error'" class="mt-2">
                  <button
                    @click="toggleDetails(alert.id)"
                    class="text-xs text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1"
                  >
                    <Icon
                      :name="expandedDetails.has(alert.id) ? 'chevron-up' : 'chevron-down'"
                      class="size-3"
                    />
                    {{ expandedDetails.has(alert.id) ? 'Hide' : 'Show' }} details
                  </button>
                  <pre
                    v-if="expandedDetails.has(alert.id)"
                    class="mt-2 text-[11px] text-zinc-400 bg-black/30 rounded-smooth p-2 overflow-x-auto"
                  >{{ alert.details }}</pre>
                </div>

                <!-- Actions -->
                <div v-if="alert.actions?.length" class="mt-3 flex gap-2">
                  <button
                    v-for="action in alert.actions"
                    :key="action.label"
                    @click="handleAction(alert, action)"
                    class="text-xs font-medium px-3 py-1.5 rounded-smooth-md transition-all"
                    :class="getActionClasses(alert.type)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </div>

              <!-- Dismiss button -->
              <button
                v-if="alert.dismissible"
                @click="alertsStore.dismiss(alert.id)"
                class="absolute top-3 right-3 p-1 rounded-smooth hover:bg-white/10 transition-colors group"
              >
                <Icon
                  name="x"
                  class="size-4 text-zinc-400 group-hover:text-zinc-200 transition-colors"
                  :stroke-width="2"
                />
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAlertsStore } from '@/stores/alerts'
import Icon from '@/components/base/Icon.vue'

const alertsStore = useAlertsStore()
const alerts = computed(() => alertsStore.alerts)

// Track expanded details
const expandedDetails = ref(new Set())

// Track paused alerts (for auto-dismiss)
const pausedAlerts = ref(new Set())
const alertTimers = ref(new Map())

// Toggle details expansion
function toggleDetails(alertId) {
  if (expandedDetails.value.has(alertId)) {
    expandedDetails.value.delete(alertId)
  } else {
    expandedDetails.value.add(alertId)
  }
}

// Get alert type specific classes
function getAlertClasses(type) {
  const baseClasses = 'bg-zinc-800/95 border'
  
  switch (type) {
    case 'error':
      return `${baseClasses} border-red-500/50 ring-red-500/20`
    case 'warning':
      return `${baseClasses} border-amber-500/50 ring-amber-500/20`
    case 'success':
      return `${baseClasses} border-emerald-500/50 ring-emerald-500/20`
    case 'info':
    default:
      return `${baseClasses} border-blue-500/50 ring-blue-500/20`
  }
}

// Get icon for alert type
function getAlertIcon(type) {
  switch (type) {
    case 'error':
      return 'alert-circle'
    case 'warning':
      return 'alert-triangle'
    case 'success':
      return 'check-circle'
    case 'info':
    default:
      return 'info'
  }
}

// Get icon classes
function getIconClasses(type) {
  switch (type) {
    case 'error':
      return 'text-red-500'
    case 'warning':
      return 'text-amber-500'
    case 'success':
      return 'text-emerald-500'
    case 'info':
    default:
      return 'text-blue-500'
  }
}

// Get action button classes
function getActionClasses(type) {
  const baseClasses = 'hover:brightness-110 active:scale-95'
  
  switch (type) {
    case 'error':
      return `${baseClasses} bg-red-500/20 text-red-400 hover:bg-red-500/30`
    case 'warning':
      return `${baseClasses} bg-amber-500/20 text-amber-400 hover:bg-amber-500/30`
    case 'success':
      return `${baseClasses} bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30`
    case 'info':
    default:
      return `${baseClasses} bg-blue-500/20 text-blue-400 hover:bg-blue-500/30`
  }
}

// Handle action button click
function handleAction(alert, action) {
  if (action.handler) {
    action.handler()
  }
  // Dismiss the alert after action
  alertsStore.dismiss(alert.id)
}

// Get progress for auto-dismiss
function getProgress(alert) {
  if (!alert.duration || pausedAlerts.value.has(alert.id)) return 100
  
  const elapsed = Date.now() - new Date(alert.timestamp).getTime()
  const progress = Math.max(0, 100 - (elapsed / alert.duration) * 100)
  return progress
}

// Pause auto-dismiss on hover
function pauseAutoDismiss(alert) {
  if (!alert.duration) return
  
  pausedAlerts.value.add(alert.id)
  
  // Clear existing timer
  if (alertTimers.value.has(alert.id)) {
    clearTimeout(alertTimers.value.get(alert.id))
    alertTimers.value.delete(alert.id)
  }
}

// Resume auto-dismiss
function resumeAutoDismiss(alert) {
  if (!alert.duration || !pausedAlerts.value.has(alert.id)) return
  
  pausedAlerts.value.delete(alert.id)
  
  // Calculate remaining time
  const elapsed = Date.now() - new Date(alert.timestamp).getTime()
  const remaining = Math.max(0, alert.duration - elapsed)
  
  if (remaining > 0) {
    const timer = setTimeout(() => {
      alertsStore.dismiss(alert.id)
    }, remaining)
    
    alertTimers.value.set(alert.id, timer)
  }
}

// Clean up when alerts are removed
watch(alerts, (newAlerts) => {
  // Clean up timers for removed alerts
  alertTimers.value.forEach((timer, alertId) => {
    if (!newAlerts.some(a => a.id === alertId)) {
      clearTimeout(timer)
      alertTimers.value.delete(alertId)
      pausedAlerts.value.delete(alertId)
      expandedDetails.value.delete(alertId)
    }
  })
}, { deep: true })
</script>

<style scoped>
/* Toast animations */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Smooth scrollbar for details */
pre::-webkit-scrollbar {
  height: 6px;
}

pre::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

pre::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>