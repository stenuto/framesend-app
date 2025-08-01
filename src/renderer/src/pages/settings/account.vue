<template>
  <div>
    <div class="">
      <h2 class="text-base font-semibold">Account Settings</h2>
      <p class="text-[13px] text-current/50">Manage your account, team, and billing.</p>
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

      <!-- Team Section -->
      <div class="border-t border-zinc-800 pt-8">
        <h3 class="text-sm font-semibold mb-6">Team</h3>
        
        <SettingsItem title="Team Members" description="Invite and manage team members.">
          <div class="space-y-4">
            <!-- Current Members -->
            <div class="space-y-3">
              <div v-for="member in teamMembers" :key="member.id"
                class="flex items-center justify-between p-3 bg-zinc-800/50 rounded-smooth-md">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span class="text-xs font-medium">{{ getInitials(member.name) }}</span>
                  </div>
                  <div>
                    <p class="text-xs font-medium">{{ member.name }}</p>
                    <p class="text-[10px] text-zinc-500">{{ member.email }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[10px] px-2 py-0.5 rounded-full capitalize"
                    :class="member.role === 'owner' ? 'bg-blue-900/30 text-blue-400' : 'bg-zinc-800 text-zinc-400'">
                    {{ member.role }}
                  </span>
                  <button v-if="member.role !== 'owner'"
                    class="text-[10px] text-zinc-500 hover:text-red-400">
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <!-- Invite Member -->
            <div class="pt-2">
              <button
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 rounded-smooth-md hover:bg-zinc-700 transition-colors">
                <Icon name="user-plus" class="w-3 h-3" />
                Invite team member
              </button>
            </div>
          </div>
        </SettingsItem>

        <SettingsItem title="Permissions" description="Configure default permissions for team members.">
          <div class="space-y-3">
            <label class="flex items-center">
              <input v-model="teamSettings.allowUploads" type="checkbox"
                class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
              <span class="ml-2 text-xs">Allow team members to upload videos</span>
            </label>

            <label class="flex items-center">
              <input v-model="teamSettings.allowDeletes" type="checkbox"
                class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
              <span class="ml-2 text-xs">Allow team members to delete videos</span>
            </label>

            <label class="flex items-center">
              <input v-model="teamSettings.allowSettings" type="checkbox"
                class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
              <span class="ml-2 text-xs">Allow team members to change encoding settings</span>
            </label>
          </div>
        </SettingsItem>
      </div>

      <!-- Billing Section -->
      <div class="border-t border-zinc-800 pt-8">
        <h3 class="text-sm font-semibold mb-6">Billing</h3>
        
        <SettingsItem title="Current Plan" description="Your active subscription plan.">
          <div class="p-3 bg-zinc-800/50 rounded-smooth-md">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium">Pro Team</p>
              <span class="text-xs font-semibold">$29/month</span>
            </div>
            <p class="text-[10px] text-zinc-500 mb-3">5 team members • Unlimited videos • Priority encoding</p>
            
            <div class="space-y-2">
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-400">Team members</span>
                <span>{{ teamMembers.length }} / 5</span>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-400">Next billing date</span>
                <span>Feb 15, 2024</span>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-400">Storage used</span>
                <span>124 GB / 500 GB</span>
              </div>
            </div>
            
            <div class="mt-3 pt-3 border-t border-zinc-700">
              <button class="text-xs text-blue-400 hover:text-blue-300 mr-3">
                Upgrade plan
              </button>
              <button class="text-xs text-zinc-400 hover:text-zinc-300">
                Change plan
              </button>
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
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'
import SettingsItem from '@/components/settings/SettingsItem.vue'
import Icon from '@/components/base/Icon.vue'

export default {
  name: 'AccountSettings',
  components: {
    SettingsItem,
    Icon
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

    // Team members data
    const teamMembers = ref([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'member'
      }
    ])

    // Team settings
    const teamSettings = computed({
      get() {
        const team = settings.value.team || {}
        return {
          allowUploads: team.allowUploads !== false, // default true
          allowDeletes: team.allowDeletes !== false, // default true
          allowSettings: team.allowSettings === true // default false
        }
      },
      set(value) {
        settings.value.team = value
      }
    })

    // Billing data
    const recentInvoices = ref([
      {
        id: 1,
        description: 'Pro Team - Monthly',
        date: 'Jan 15, 2024',
        amount: '29.00'
      },
      {
        id: 2,
        description: 'Pro Team - Monthly',
        date: 'Dec 15, 2023',
        amount: '29.00'
      },
      {
        id: 3,
        description: 'Pro Team - Monthly',
        date: 'Nov 15, 2023',
        amount: '29.00'
      }
    ])

    // Helper functions
    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }

    // Watch team settings for changes
    watch(teamSettings, () => {
      // Settings will auto-save through the store's watcher
    }, { deep: true })

    return {
      loading: isLoading,
      email,
      displayName,
      twoFactorEnabled,
      teamMembers,
      teamSettings,
      recentInvoices,
      getInitials
    }
  }
}
</script>