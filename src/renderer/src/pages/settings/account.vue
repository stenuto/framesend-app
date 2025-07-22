<template>
  <div class="">
    <h2 class="text-[15px] font-semibold">Account Settings</h2>
    <p class="text-[13px] text-current/50 mb-4">Manage your account information.</p>
    
    <div class="space-y-6">
      <SettingsItem title="Email" description="Your account email address.">
        <input type="email" value="steve@example.com" 
          class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-700" />
      </SettingsItem>
      
      <SettingsItem title="Display Name" description="Your name as it appears in the app.">
        <input type="text" value="Steve Tenuto" 
          class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md border border-zinc-300 dark:border-zinc-700" />
      </SettingsItem>
    </div>
  </div>
</template>

<script>
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'AccountSettings',
  components: {
    SettingsItem
  }
}
</script>