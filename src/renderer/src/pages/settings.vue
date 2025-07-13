<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-zinc-300 dark:border-zinc-700">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
Encoding Settings
</h1>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
Configure video encoding options
</p>
        </div>
        <Button variant="ghost" size="sm" @click="goBack">
          <Icon name="arrow-left" class="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <p class="text-zinc-500">
Loading settings...
</p>
      </div>

      <div v-else class="max-w-2xl space-y-8">
        <!-- H.264 Settings -->
        <div>
          <h2 class="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
H.264 Encoding
</h2>
          <div class="space-y-4">
            <label class="flex items-center">
              <input 
                v-model="settings.h264.enabled" 
                type="checkbox"
                class="w-4 h-4 text-cyan-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-cyan-500 focus:ring-2"
              >
              <span class="ml-2 text-sm text-zinc-700 dark:text-zinc-300">Enable H.264 encoding</span>
            </label>

            <div v-if="settings.h264.enabled" class="ml-6 space-y-4">
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">
                  Quality setting:
                </p>
                <QualitySlider
                  v-model="settings.h264.quality"
                  left-label="Faster encoding"
                  right-label="Higher quality"
                />
              </div>
              
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">
                  Resolution rungs:
                </p>
                <label v-for="rung in h264Rungs" :key="rung" class="flex items-center">
                  <input 
                    v-model="settings.h264.rungs[rung]" 
                    type="checkbox"
                    class="w-4 h-4 text-cyan-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-cyan-500 focus:ring-2"
                  >
                  <span class="ml-2 text-sm text-zinc-700 dark:text-zinc-300">{{ rung }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- AV1 Settings -->
        <div>
          <h2 class="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
AV1 4K HQ Mode
</h2>
          <div class="space-y-4">
            <label class="flex items-center">
              <input 
                v-model="settings.av1.enabled" 
                type="checkbox"
                class="w-4 h-4 text-cyan-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-cyan-500 focus:ring-2"
              >
              <span class="ml-2 text-sm text-zinc-700 dark:text-zinc-300">Enable AV1 4K HQ encoding</span>
            </label>

            <div v-if="settings.av1.enabled" class="ml-6 space-y-4">
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">
                  Quality setting:
                </p>
                <QualitySlider
                  v-model="settings.av1.quality"
                  left-label="Faster encoding"
                  right-label="Higher quality"
                />
              </div>
              
              <div class="space-y-3">
                <p class="text-sm text-zinc-600 dark:text-zinc-400">
                  High-quality 4K encoding using AV1 codec with 10-bit color depth and optimized settings.
                </p>
                <ul class="mt-2 text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
                  <li>• 10-bit 4:2:0 color</li>
                  <li>• Preset 5 (balanced speed/quality)</li>
                  <li>• Content-adaptive quantization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <div class="flex items-center justify-between">
            <p v-if="saveStatus" :class="[
              'text-sm',
              saveStatus === 'saved' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
            ]">
              {{ saveStatus === 'saved' ? 'Settings saved successfully' : 'Failed to save settings' }}
            </p>
            <div class="flex gap-3">
              <Button variant="outline" @click="loadSettings">
                Reset
              </Button>
              <Button variant="default" class-name="bg-cyan-500 hover:bg-cyan-600 text-white" @click="saveSettings">
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, toRaw } from 'vue'
import { useRouterStore } from '../stores/router'
import Button from '@components/base/Button.vue'
import Icon from '@components/base/Icon.vue'
import QualitySlider from '@components/base/QualitySlider.vue'

export default {
  name: 'SettingsPage',
  components: {
    Button,
    Icon,
    QualitySlider
  },
  meta: {
    title: 'Settings'
  },
  setup() {
    const router = useRouterStore()
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
        quality: 3  // Single quality for all H.264 renditions
      },
      av1: {
        enabled: false,
        rungs: {
          '2160p_hq': true
        },
        quality: 5  // Single quality for all AV1 renditions
      }
    })

    const h264Rungs = ['360p', '720p', '1080p', '2160p']

    const loadSettings = async () => {
      try {
        loading.value = true
        console.log('Loading settings...')
        const loadedSettings = await window.api.settings.load()
        console.log('Loaded settings:', loadedSettings)
        if (loadedSettings) {
          // Ensure quality properties exist for backward compatibility
          if (!loadedSettings.h264.quality || typeof loadedSettings.h264.quality === 'object') {
            loadedSettings.h264.quality = 3
          }
          if (!loadedSettings.av1.quality || typeof loadedSettings.av1.quality === 'object') {
            loadedSettings.av1.quality = 5
          }
          settings.value = loadedSettings
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
        console.error('Error details:', error.message, error.stack)
      } finally {
        loading.value = false
      }
    }

    const saveSettings = async () => {
      try {
        // Use toRaw to get the plain object from Vue's reactive proxy
        const rawSettings = toRaw(settings.value)
        console.log('Saving settings:', rawSettings)
        console.log('AV1 quality value:', rawSettings.av1.quality['2160p_hq'])
        const result = await window.api.settings.save(rawSettings)
        console.log('Save result:', result)
        saveStatus.value = 'saved'
        setTimeout(() => {
          saveStatus.value = ''
        }, 3000)
      } catch (error) {
        console.error('Failed to save settings:', error)
        console.error('Error details:', error.message, error.stack)
        saveStatus.value = 'error'
        setTimeout(() => {
          saveStatus.value = ''
        }, 3000)
      }
    }

    const goBack = () => {
      router.navigateTo('upload')
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
      saveSettings,
      goBack
    }
  }
}
</script>