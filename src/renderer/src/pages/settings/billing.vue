<template>
  <div>
    <div class="">
      <h2 class="text-base font-semibold">Billing Settings</h2>
      <p class="text-[13px] text-current/50">Manage your subscription and payment methods.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-zinc-500">Loading billing...</p>
    </div>
    
    <div v-else class="space-y-8 pt-8">
      <SettingsItem title="Current Plan" description="Your active subscription plan.">
        <div class="p-3 bg-zinc-800/50 rounded-smooth-md">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-medium">Pro Plan</p>
            <span class="text-xs font-semibold">$29/month</span>
          </div>
          <p class="text-[10px] text-zinc-500 mb-3">Unlimited videos • 500 GB storage • Priority encoding</p>
          
          <div class="space-y-2">
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">Next billing date</span>
              <span>Feb 15, 2024</span>
            </div>
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">Videos this month</span>
              <span>127 / Unlimited</span>
            </div>
            <div class="flex justify-between text-[10px]">
              <span class="text-zinc-400">Storage used</span>
              <span>87 GB / 500 GB</span>
            </div>
          </div>
        </div>
      </SettingsItem>
      
      <SettingsItem title="Payment Method" description="Your default payment method.">
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-smooth-md">
            <div class="flex items-center gap-3">
              <div class="w-10 h-6 bg-zinc-700 rounded flex items-center justify-center">
                <span class="text-[8px] font-bold">VISA</span>
              </div>
              <div>
                <p class="text-xs">•••• •••• •••• 4242</p>
                <p class="text-[10px] text-zinc-500">Expires 12/25</p>
              </div>
            </div>
            <button class="text-[10px] text-zinc-500 hover:text-zinc-300">
              Update
            </button>
          </div>
          
          <button class="text-xs text-blue-400 hover:text-blue-300">
            Add payment method
          </button>
        </div>
      </SettingsItem>

      <SettingsItem title="Billing History" description="View your past invoices.">
        <div class="space-y-2">
          <div v-for="invoice in recentInvoices" :key="invoice.id" 
            class="flex items-center justify-between py-2 text-xs">
            <div>
              <p class="font-medium">{{ invoice.description }}</p>
              <p class="text-[10px] text-zinc-500">{{ invoice.date }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium">${{ invoice.amount }}</p>
              <button class="text-[10px] text-blue-400 hover:text-blue-300">
                Download
              </button>
            </div>
          </div>
          
          <button class="text-xs text-zinc-400 hover:text-zinc-300 mt-2">
            View all invoices
          </button>
        </div>
      </SettingsItem>
      
      <SettingsItem title="Subscription" description="Manage your subscription settings.">
        <div class="space-y-3">
          <button class="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-smooth-md hover:bg-blue-600 transition-colors">
            Upgrade Plan
          </button>
          <button class="text-xs text-zinc-400 hover:text-zinc-300">
            Change plan
          </button>
          <button class="text-xs text-red-400 hover:text-red-300">
            Cancel subscription
          </button>
        </div>
      </SettingsItem>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import SettingsItem from '@/components/settings/SettingsItem.vue'

export default {
  name: 'BillingSettings',
  components: {
    SettingsItem
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { isLoading } = storeToRefs(settingsStore)

    // Mock billing data
    const recentInvoices = ref([
      {
        id: 1,
        description: 'Pro Plan - Monthly',
        date: 'Jan 15, 2024',
        amount: '29.00'
      },
      {
        id: 2,
        description: 'Pro Plan - Monthly',
        date: 'Dec 15, 2023',
        amount: '29.00'
      },
      {
        id: 3,
        description: 'Pro Plan - Monthly',
        date: 'Nov 15, 2023',
        amount: '29.00'
      }
    ])

    return {
      loading: isLoading,
      recentInvoices
    }
  }
}
</script>