<template>
  <div>
    <div class="">
      <h2 class="text-base font-semibold">Account Settings</h2>
      <p class="text-[13px] text-current/50">Manage your account information.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-zinc-500">Loading account...</p>
    </div>
    
    <div v-else class="space-y-8 pt-8">
      <SettingsItem title="Email" description="Your account email address.">
        <input type="email" v-model="email" 
          class="w-full text-xs px-3 py-2 bg-zinc-800 rounded-smooth-md border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </SettingsItem>
      
      <SettingsItem title="Display Name" description="Your name as it appears in the app.">
        <input type="text" v-model="displayName" 
          class="w-full text-xs px-3 py-2 bg-zinc-800 rounded-smooth-md border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </SettingsItem>

      <SettingsItem title="Password" description="Change your account password.">
        <button class="text-xs text-blue-400 hover:text-blue-300">
          Change password
        </button>
      </SettingsItem>

      <SettingsItem title="Two-Factor Authentication" description="Add an extra layer of security to your account.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input v-model="twoFactorEnabled" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Enable two-factor authentication</span>
          </label>
          <p v-if="twoFactorEnabled" class="text-[10px] text-zinc-500 ml-5">
            Two-factor authentication is enabled. You'll need your phone to sign in.
          </p>
        </div>
      </SettingsItem>

      <SettingsItem title="Account Actions" description="Manage your account status.">
        <div class="space-y-2">
          <button class="text-xs text-zinc-400 hover:text-zinc-300">
            Export account data
          </button>
          <button class="text-xs text-red-400 hover:text-red-300">
            Delete account
          </button>
        </div>
      </SettingsItem>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'AccountSettings',
  components: {
    SettingsItem
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { settings, isLoading } = storeToRefs(settingsStore)

    // Create computed refs for account settings with auto-save
    const accountSettings = computed({
      get() {
        const account = settings.value.account || {}
        return {
          email: account.email || 'steve@example.com',
          displayName: account.displayName || 'Steve Tenuto',
          twoFactorEnabled: account.twoFactorEnabled || false
        }
      },
      set(value) {
        settings.value.account = value
      }
    })

    // Individual computed properties for v-model
    const email = computed({
      get: () => accountSettings.value.email,
      set: (value) => {
        accountSettings.value = { ...accountSettings.value, email: value }
      }
    })

    const displayName = computed({
      get: () => accountSettings.value.displayName,
      set: (value) => {
        accountSettings.value = { ...accountSettings.value, displayName: value }
      }
    })

    const twoFactorEnabled = computed({
      get: () => accountSettings.value.twoFactorEnabled,
      set: (value) => {
        accountSettings.value = { ...accountSettings.value, twoFactorEnabled: value }
      }
    })

    // Watch for changes and trigger save
    watch([email, displayName, twoFactorEnabled], () => {
      // Settings will auto-save through the store's watcher
    })

    return {
      loading: isLoading,
      email,
      displayName,
      twoFactorEnabled
    }
  }
}
</script>