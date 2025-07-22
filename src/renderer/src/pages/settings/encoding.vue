<template>
  <div class="">
    <h2 class="text-[15px] font-semibold">Encoding Settings</h2>
    <p class="text-[13px] text-current/50 mb-4">Configure video encoding options.</p>
      
    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-zinc-500">Loading settings...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- H.264 Settings -->
      <SettingsItem title="H.264 Encoding" description="Enable H.264 encoding for wide compatibility.">
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
      </SettingsItem>

      <!-- AV1 Settings -->
      <SettingsItem title="AV1 4K HQ Mode" description="Enable AV1 encoding for high quality 4K video.">
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
      </SettingsItem>

    </div>
  </div>
</template>

<script>
import { computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'EncodingSettings',
  components: {
    SettingsItem
  },
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