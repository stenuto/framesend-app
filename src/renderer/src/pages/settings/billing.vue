<template>
  <div class="">
    <h2 class="text-[15px] font-semibold">Billing Settings</h2>
    <p class="text-[13px] text-current/50 mb-4">Manage your subscription and payment methods.</p>
    
    <div class="space-y-6">
      <SettingsItem title="Current Plan" description="Your active subscription plan.">
        <div class="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-md">
          <p class="text-sm font-medium">Pro Plan</p>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">$29/month</p>
        </div>
      </SettingsItem>
      
      <SettingsItem title="Subscription" description="Manage your subscription settings.">
        <button class="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600">
          Manage Subscription
        </button>
      </SettingsItem>
    </div>
  </div>
</template>

<script>
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'BillingSettings',
  components: {
    SettingsItem
  }
}
</script>