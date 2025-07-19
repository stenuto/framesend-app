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

        <!-- Save Button -->
        <div class="pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <div class="flex items-center justify-between">
            <p v-if="saveStatus" :class="[
              'text-sm',
              saveStatus === 'saved' ? 'text-green-600' : 'text-red-600'
            ]">
              {{ saveStatus === 'saved' ? 'Settings saved successfully' : 'Failed to save settings' }}
            </p>
            <div class="flex gap-3">
              <button @click="loadSettings" 
                class="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Reset
              </button>
              <button @click="saveSettings" 
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, toRaw } from 'vue'

export default {
  name: 'EncodingSettings',
  setup() {
    const loading = ref(true)
    const saveStatus = ref('')
    const settings = ref({
      h264: {
        enabled: true,
        rungs: {
          '360p': true,
          '720p': true,
          '1080p': true,
          '2160p': true
        },
        quality: 3
      },
      av1: {
        enabled: false,
        rungs: {
          '2160p_hq': true
        },
        quality: 5
      }
    })

    const h264Rungs = ['360p', '720p', '1080p', '2160p']

    const loadSettings = async () => {
      try {
        loading.value = true
        const loadedSettings = await window.api.settings.load()
        if (loadedSettings) {
          settings.value = loadedSettings
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        loading.value = false
      }
    }

    const saveSettings = async () => {
      try {
        const rawSettings = toRaw(settings.value)
        await window.api.settings.save(rawSettings)
        saveStatus.value = 'saved'
        setTimeout(() => {
          saveStatus.value = ''
        }, 3000)
      } catch (error) {
        console.error('Failed to save settings:', error)
        saveStatus.value = 'error'
        setTimeout(() => {
          saveStatus.value = ''
        }, 3000)
      }
    }

    onMounted(() => {
      loadSettings()
    })

    return {
      loading,
      saveStatus,
      settings,
      h264Rungs,
      loadSettings,
      saveSettings
    }
  }
}
</script>