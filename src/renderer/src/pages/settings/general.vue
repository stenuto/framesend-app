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
      <!-- Appearance setting removed - dark mode only -->
      <SettingsItem title="Language" description="Select the app language.">
        <p class="text-xs text-zinc-400">English (Default)</p>
      </SettingsItem>
    </div>
  </div>
</template>

<script>
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'GeneralSettings',
  components: {
    SettingsItem
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { isLoading } = storeToRefs(settingsStore)

    return {
      loading: isLoading
    }
  }
}
</script>