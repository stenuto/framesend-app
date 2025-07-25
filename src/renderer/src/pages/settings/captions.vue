<template>
  <div class="">
    <h2 class="text-[15px] font-semibold">Caption Settings</h2>
    <p class="text-[13px] text-current/50 mb-4">Configure automatic caption generation and subtitle options.</p>
      
    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-zinc-500">Loading settings...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Auto-Generate Captions -->
      <SettingsItem title="Auto-Generate Captions" description="Automatically generate captions for uploaded videos.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input 
              v-model="settings.autoGenerate" 
              type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-blue-500 focus:ring-1"
            >
            <span class="ml-2 text-xs">Enable automatic caption generation</span>
          </label>

          <div v-if="settings.autoGenerate" class="ml-5 space-y-3">
            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Default language:</p>
              <select v-model="settings.defaultLanguage" 
                class="text-xs px-2 py-1 dark:bg-zinc-800 bg-zinc-100 border dark:border-zinc-700 border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese (Simplified)</option>
              </select>
            </div>
          </div>
        </div>
      </SettingsItem>

      <!-- Caption Accuracy -->
      <SettingsItem title="Caption Accuracy" description="Balance between speed and accuracy of caption generation.">
        <div class="space-y-2">
          <input type="range" min="1" max="3" v-model="settings.accuracy" 
            class="w-full h-1" />
          <div class="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-500">
            <span>Fast</span>
            <span>Balanced</span>
            <span>Accurate</span>
          </div>
        </div>
      </SettingsItem>

      <!-- Subtitle Formats -->
      <SettingsItem title="Export Formats" description="Choose which subtitle formats to generate.">
        <div class="space-y-1.5">
          <label class="flex items-center">
            <input 
              v-model="settings.formats.srt" 
              type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded"
            >
            <span class="ml-2 text-xs">SRT (SubRip)</span>
          </label>
          <label class="flex items-center">
            <input 
              v-model="settings.formats.vtt" 
              type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded"
            >
            <span class="ml-2 text-xs">WebVTT</span>
          </label>
          <label class="flex items-center">
            <input 
              v-model="settings.formats.ass" 
              type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded"
            >
            <span class="ml-2 text-xs">ASS/SSA (Advanced SubStation)</span>
          </label>
        </div>
      </SettingsItem>

      <!-- Burn-in Captions -->
      <SettingsItem title="Burn-in Options" description="Permanently embed captions into video.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input 
              v-model="settings.burnIn.enabled" 
              type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-blue-500 focus:ring-1"
            >
            <span class="ml-2 text-xs">Create version with burned-in captions</span>
          </label>

          <div v-if="settings.burnIn.enabled" class="ml-5 space-y-2">
            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Font size:</p>
              <select v-model="settings.burnIn.fontSize" 
                class="text-xs px-2 py-1 dark:bg-zinc-800 bg-zinc-100 border dark:border-zinc-700 border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Position:</p>
              <select v-model="settings.burnIn.position" 
                class="text-xs px-2 py-1 dark:bg-zinc-800 bg-zinc-100 border dark:border-zinc-700 border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
                <option value="center">Center</option>
              </select>
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
  name: 'CaptionsSettings',
  components: {
    SettingsItem
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { settings, isLoading } = storeToRefs(settingsStore)

    // Create computed refs for caption settings with auto-save
    const captionSettings = computed({
      get() {
        return settings.value.captions || {
          autoGenerate: false,
          defaultLanguage: 'en',
          accuracy: 2, // 1-3: Fast, Balanced, Accurate
          formats: {
            srt: true,
            vtt: true,
            ass: false
          },
          burnIn: {
            enabled: false,
            fontSize: 'medium',
            position: 'bottom'
          }
        }
      },
      set(value) {
        settings.value.captions = value
      }
    })
    
    // Watch for changes and trigger save
    watch(captionSettings, () => {
      // Settings will auto-save through the store's watcher
    }, { deep: true })

    return {
      loading: isLoading,
      settings: captionSettings
    }
  }
}
</script>