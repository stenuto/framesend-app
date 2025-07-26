<!-- eslint-disable vue/no-reserved-component-names -->
<template>
  <div>
    <div class="">
      <h2 class="text-base font-semibold">General Settings</h2>
      <p class="text-[13px] text-current/50">General settings for the app.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-zinc-500">Loading settings...</p>
    </div>

    <div v-else class="space-y-8 pt-8">
      <SettingsItem title="Appearance" description="Select the appearance of the app.">
        <Select v-model="appearance" class="w-40" :options="appearanceOptions" placeholder="Select appearance" />
      </SettingsItem>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import Select from '@/components/base/Select.vue'
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'GeneralSettings',
  components: {
    Select,
    SettingsItem
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { isLoading } = storeToRefs(settingsStore)

    // Computed property for v-model binding
    const appearance = computed({
      get: () => settingsStore.settings.general.appearance,
      set: (value) => settingsStore.updateAppearance(value)
    })

    const appearanceOptions = [
      { label: 'System', value: 'system' },
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' }
    ]

    return {
      loading: isLoading,
      appearance,
      appearanceOptions
    }
  }
}
</script>