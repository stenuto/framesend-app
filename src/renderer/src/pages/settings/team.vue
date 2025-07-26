<template>
  <div>
    <div class="">
      <h2 class="text-base font-semibold">Team Settings</h2>
      <p class="text-[13px] text-current/50">Manage your team members and permissions.</p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-zinc-500">Loading team...</p>
    </div>

    <div v-else class="space-y-8 pt-8">
      <!-- Team Members -->
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

      <!-- Team Settings -->
      <SettingsItem title="Permissions" description="Configure default permissions for team members.">
        <div class="space-y-3">
          <label class="flex items-center">
            <input v-model="settings.allowUploads" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Allow team members to upload videos</span>
          </label>

          <label class="flex items-center">
            <input v-model="settings.allowDeletes" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Allow team members to delete videos</span>
          </label>

          <label class="flex items-center">
            <input v-model="settings.allowSettings" type="checkbox"
              class="w-3 h-3 text-blue-500 bg-zinc-800 border-zinc-600 rounded focus:ring-blue-500 focus:ring-1 accent-blue-500">
            <span class="ml-2 text-xs">Allow team members to change encoding settings</span>
          </label>
        </div>
      </SettingsItem>

      <!-- Team Plan -->
      <SettingsItem title="Team Plan" description="Manage your team subscription and limits.">
        <div class="space-y-3">
          <div class="p-3 bg-zinc-800/50 rounded-smooth-md">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-medium">Current Plan</p>
              <span class="text-xs font-semibold text-blue-400">Pro Team</span>
            </div>
            <p class="text-[10px] text-zinc-500 mb-3">5 team members • Unlimited videos • Priority encoding</p>

            <div class="space-y-2">
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-400">Team members</span>
                <span>3 / 5</span>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-400">Storage used</span>
                <span>124 GB / 500 GB</span>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="text-zinc-400">Videos this month</span>
                <span>847</span>
              </div>
            </div>
          </div>

          <button class="text-xs text-blue-400 hover:text-blue-300">
            Upgrade plan
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
import Icon from '@/components/base/Icon.vue'

export default {
  name: 'TeamSettings',
  components: {
    SettingsItem,
    Icon
  },
  setup() {
    const settingsStore = useSettingsStore()
    const { settings, isLoading } = storeToRefs(settingsStore)

    // Mock team members data
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

    // Create computed refs for team settings with auto-save
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

    // Watch for changes and trigger save
    watch(teamSettings, () => {
      // Settings will auto-save through the store's watcher
    }, { deep: true })

    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }

    return {
      loading: isLoading,
      settings: teamSettings,
      teamMembers,
      getInitials
    }
  }
}
</script>