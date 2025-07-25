<template>
  <div>
    <div class="">
      <h2 class="text-base font-semibold">Encoding Settings</h2>
      <p class="text-[13px] text-current/50">Configure video encoding options.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-zinc-500">Loading settings...</p>
    </div>

    <div v-else class="space-y-8 pt-8">
      <!-- H.264 Settings -->
      <SettingsItem title="H.264 Encoding" description="Enable H.264 encoding for wide compatibility.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input v-model="settings.h264.enabled" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Enable H.264 encoding</span>
          </label>

          <div v-if="settings.h264.enabled" class="ml-5 space-y-3">
            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Quality setting:</p>
              <input type="range" min="1" max="5" v-model.number="settings.h264.quality" class="w-full h-1 accent-blue-500" />
              <div class="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-500">
                <span>Fastest</span>
                <span>Best Quality</span>
              </div>
            </div>

            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Resolution rungs:</p>
              <div class="space-y-1.5">
                <label v-for="rung in h264Rungs" :key="rung" class="flex items-center">
                  <input v-model="settings.h264.rungs[rung]" type="checkbox"
                    class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded accent-blue-500">
                  <span class="ml-2 text-xs">{{ rung }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </SettingsItem>

      <!-- AV1 Settings -->
      <SettingsItem title="AV1 4K HQ Mode" description="Enable AV1 encoding for high quality 4K video.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input v-model="settings.av1.enabled" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded accent-blue-500">
            <span class="ml-2 text-xs">Enable AV1 4K HQ encoding</span>
          </label>

          <div v-if="settings.av1.enabled" class="ml-5 space-y-3">
            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Quality setting:</p>
              <input type="range" min="1" max="5" v-model.number="settings.av1.quality"
                class="w-full h-1 accent-blue-500" />
              <div class="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-500">
                <span>Fastest</span>
                <span>Best Quality</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsItem>

      <!-- Hardware Acceleration -->
      <SettingsItem title="Hardware Acceleration" description="Speed up encoding using your GPU when available.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input v-model="settings.hardwareAcceleration.enabled" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Use GPU acceleration when available</span>
          </label>
          <p v-if="settings.hardwareAcceleration.enabled" class="ml-5 text-[10px] text-zinc-500">
            Automatically detects and uses NVIDIA, AMD, Intel, or Apple Silicon hardware
          </p>
        </div>
      </SettingsItem>

      <!-- Streaming Optimization -->
      <SettingsItem title="Streaming Optimization" description="Optimize for different viewing scenarios.">
        <div class="space-y-2">
          <div class="space-y-1.5">
            <label class="flex items-center">
              <input v-model="settings.streamingPreset" type="radio" value="fast-start"
                class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 accent-blue-500">
              <span class="ml-2 text-xs">Fast Start</span>
            </label>
            <p class="ml-5 text-[10px] text-zinc-500">Quick playback start, ideal for short videos</p>

            <label class="flex items-center mt-2">
              <input v-model="settings.streamingPreset" type="radio" value="balanced"
                class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 accent-blue-500">
              <span class="ml-2 text-xs">Balanced</span>
            </label>
            <p class="ml-5 text-[10px] text-zinc-500">Good mix of startup time and quality</p>

            <label class="flex items-center mt-2">
              <input v-model="settings.streamingPreset" type="radio" value="best-quality"
                class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 accent-blue-500">
              <span class="ml-2 text-xs">Best Quality</span>
            </label>
            <p class="ml-5 text-[10px] text-zinc-500">Maximum quality for longer videos</p>
          </div>
        </div>
      </SettingsItem>

      <!-- Audio Enhancement -->
      <SettingsItem title="Audio Enhancement" description="Improve audio consistency and clarity.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input v-model="settings.audioEnhancement.enabled" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Optimize audio levels</span>
          </label>

          <div v-if="settings.audioEnhancement.enabled" class="ml-5 space-y-2">
            <div class="space-y-2">
              <p class="text-xs text-zinc-600 dark:text-zinc-400">Audio processing:</p>
              <input type="range" min="1" max="5" v-model="settings.audioEnhancement.level" class="w-full h-1 accent-blue-500" />
              <div class="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-500">
                <span>Preserve dynamics</span>
                <span>Consistent volume</span>
              </div>
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
    const encodingSettings = computed({
      get() {
        // Ensure all properties exist with defaults
        const encoding = settings.value.encoding || {}
        return {
          h264: encoding.h264 || {
            enabled: true,
            quality: 5,
            rungs: {
              '360p': true,
              '720p': true,
              '1080p': true,
              '2160p': false
            }
          },
          av1: encoding.av1 || {
            enabled: false,
            quality: 5
          },
          hardwareAcceleration: encoding.hardwareAcceleration || {
            enabled: true
          },
          streamingPreset: encoding.streamingPreset || 'balanced',
          audioEnhancement: encoding.audioEnhancement || {
            enabled: true,
            level: 3
          }
        }
      },
      set(value) {
        settings.value.encoding = value
      }
    })

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