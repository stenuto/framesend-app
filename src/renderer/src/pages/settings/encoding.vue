<template>
  <div class="p-6">
    <div class="max-w-2xl">
      <h2 class="text-xl font-semibold mb-2">Encoding Settings</h2>
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Configure video encoding options</p>
      
      <div v-if="loading" class="flex items-center justify-center py-12">
        <p class="text-zinc-500">Loading settings...</p>
      </div>

      <div v-else class="space-y-8">
        <!-- H.264 Settings -->
        <div>
          <h3 class="text-lg font-medium mb-4">H.264 Encoding</h3>
          <div class="space-y-4">
            <label class="flex items-center">
              <input 
                v-model="settings.h264.enabled" 
                type="checkbox"
                class="w-4 h-4 text-cyan-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-cyan-500 focus:ring-2"
              >
              <span class="ml-2 text-sm">Enable H.264 encoding</span>
            </label>

            <div v-if="settings.h264.enabled" class="ml-6 space-y-4">
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">Quality setting:</p>
                <input type="range" min="1" max="10" v-model="settings.h264.quality" 
                  class="w-full" />
              </div>
              
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">Resolution rungs:</p>
                <label v-for="rung in h264Rungs" :key="rung" class="flex items-center">
                  <input 
                    v-model="settings.h264.rungs[rung]" 
                    type="checkbox"
                    class="w-4 h-4 text-cyan-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded"
                  >
                  <span class="ml-2 text-sm">{{ rung }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- AV1 Settings -->
        <div>
          <h3 class="text-lg font-medium mb-4">AV1 4K HQ Mode</h3>
          <div class="space-y-4">
            <label class="flex items-center">
              <input 
                v-model="settings.av1.enabled" 
                type="checkbox"
                class="w-4 h-4 text-cyan-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded"
              >
              <span class="ml-2 text-sm">Enable AV1 4K HQ encoding</span>
            </label>

            <div v-if="settings.av1.enabled" class="ml-6 space-y-4">
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">Quality setting:</p>
                <input type="range" min="1" max="10" v-model="settings.av1.quality" 
                  class="w-full" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

export default {
  name: 'EncodingSettings',
  setup() {
    const settingsStore = useSettingsStore()
    const { settings, isLoading } = storeToRefs(settingsStore)

    const h264Rungs = ['360p', '720p', '1080p', '2160p']

    // Create computed refs for encoding settings with auto-save
    const encodingSettings = computed(() => settings.value.encoding)
    
    // Watch for changes and trigger save
    watch(encodingSettings, () => {
      // Settings will auto-save through the store's watcher
    }, { deep: true })

    return {
      loading: isLoading,
      settings: encodingSettings,
      h264Rungs
    }
  }
}
</script>