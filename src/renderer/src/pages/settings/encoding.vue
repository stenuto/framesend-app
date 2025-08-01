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
      <!-- Custom Rung Configurator -->
      <SettingsItem title="Encoding Configuration" description="Configure custom quality levels for video encoding.">
        <CustomRungConfigurator :modelValue="settings.customRungs" @update:modelValue="updateCustomRungs" />
      </SettingsItem>

      <!-- Hardware Acceleration -->
      <SettingsItem title="Hardware Acceleration" description="Speed up encoding using your GPU when available.">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <ToggleSwitch v-model="settings.hardwareAcceleration.enabled" size="lg" />
            <span class="text-xs">Use GPU acceleration when available</span>
          </div>
          <p v-if="settings.hardwareAcceleration.enabled" class="text-[10px] text-zinc-500">
            Automatically detects and uses NVIDIA, AMD, Intel, or Apple Silicon hardware
          </p>
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
import CustomRungConfigurator from '@/components/settings/CustomRungConfigurator.vue'
import ToggleSwitch from '@/components/base/ToggleSwitch.vue'
import { DEFAULT_CUSTOM_RUNGS } from '@/utils/encoding-utils'

export default {
  name: 'EncodingSettings',
  components: {
    SettingsItem,
    CustomRungConfigurator,
    ToggleSwitch
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { settings, isLoading } = storeToRefs(settingsStore)

    // Create computed refs for encoding settings with auto-save
    const encodingSettings = computed({
      get() {
        // Ensure all properties exist with defaults
        const encoding = settings.value.encoding || {}
        return {
          customRungs: encoding.customRungs || DEFAULT_CUSTOM_RUNGS,
          hardwareAcceleration: encoding.hardwareAcceleration || {
            enabled: true
          }
        }
      },
      set(value) {
        settings.value.encoding = value
      }
    })

    // Update custom rungs
    const updateCustomRungs = (newRungs) => {
      settings.value.encoding = {
        ...settings.value.encoding,
        customRungs: newRungs
      }
    }

    // Watch for changes and trigger save
    watch(encodingSettings, () => {
      // Settings will auto-save through the store's watcher
    }, { deep: true })

    return {
      loading: isLoading,
      settings: encodingSettings,
      updateCustomRungs
    }
  }
}
</script>