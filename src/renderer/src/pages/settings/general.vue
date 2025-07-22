<!-- eslint-disable vue/no-reserved-component-names -->
<template>
  <div class="">
    <h2 class="text-[15px] font-semibold">General Settings</h2>
    <p class="text-[13px] text-current/50 mb-4">
      General settings for the app.
    </p>
    <SettingsItem title="Appearance" description="Select the appearance of the app.">
      <Select v-model="appearance" class="w-40" :options="appearanceOptions" placeholder="Select appearance" />
    </SettingsItem>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
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
      appearance,
      appearanceOptions
    }
  }
}
</script>