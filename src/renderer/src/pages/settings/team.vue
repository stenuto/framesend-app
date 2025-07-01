<template>
  <div class="team-settings-page p-6">
    <div class="mb-6">
      <button 
        @click="router.navigate('settings')"
        class="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <Icon name="arrow-left" class="size-4" />
        Back to Settings
      </button>
    </div>
    
    <h1 class="text-2xl font-bold text-zinc-100 mb-6">Team Settings</h1>
    
    <div class="space-y-6">
      <!-- Team Members -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-zinc-100">Team Members</h2>
          <button class="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors">
            Invite Member
          </button>
        </div>
        
        <div class="space-y-3">
          <!-- Team Member -->
          <div class="flex items-center justify-between p-3 bg-zinc-700 rounded-md">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-100">John Doe</p>
                <p class="text-xs text-zinc-400">john@example.com</p>
              </div>
            </div>
            <span class="text-sm text-zinc-300">Admin</span>
          </div>
          
          <!-- Team Member -->
          <div class="flex items-center justify-between p-3 bg-zinc-700 rounded-md">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                JS
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-100">Jane Smith</p>
                <p class="text-xs text-zinc-400">jane@example.com</p>
              </div>
            </div>
            <span class="text-sm text-zinc-300">Editor</span>
          </div>
          
          <!-- Team Member -->
          <div class="flex items-center justify-between p-3 bg-zinc-700 rounded-md">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                MJ
              </div>
              <div>
                <p class="text-sm font-medium text-zinc-100">Mike Johnson</p>
                <p class="text-xs text-zinc-400">mike@example.com</p>
              </div>
            </div>
            <span class="text-sm text-zinc-300">Viewer</span>
          </div>
        </div>
      </div>
      
      <!-- Permissions -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <h2 class="text-lg font-semibold text-zinc-100 mb-4">Default Permissions</h2>
        
        <div class="space-y-3">
          <label class="flex items-center">
            <input type="checkbox" checked class="size-4 text-amber-500 rounded border-zinc-600" />
            <span class="ml-2 text-sm text-zinc-300">Can create projects</span>
          </label>
          
          <label class="flex items-center">
            <input type="checkbox" checked class="size-4 text-amber-500 rounded border-zinc-600" />
            <span class="ml-2 text-sm text-zinc-300">Can upload videos</span>
          </label>
          
          <label class="flex items-center">
            <input type="checkbox" class="size-4 text-amber-500 rounded border-zinc-600" />
            <span class="ml-2 text-sm text-zinc-300">Can delete videos</span>
          </label>
          
          <label class="flex items-center">
            <input type="checkbox" class="size-4 text-amber-500 rounded border-zinc-600" />
            <span class="ml-2 text-sm text-zinc-300">Can manage team members</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouterStore } from '../../stores/router'
import Icon from '../../components/base/Icon.vue'

export default {
  name: 'TeamSettingsPage',
  components: {
    Icon
  },
  meta: {
    title: 'Team Settings',
    parent: 'settings'
  },
  setup() {
    const router = useRouterStore()
    return { router }
  }
}
</script>