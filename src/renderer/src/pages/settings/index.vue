<template>
  <div class="settings-page p-6">
    <h1 class="text-2xl font-bold text-zinc-100 mb-6">Settings</h1>
    
    <!-- Settings Navigation -->
    <div class="flex gap-4 mb-6">
      <button 
        @click="navigateToSubPage('settings/general')"
        class="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors"
      >
        General
      </button>
      <button 
        @click="navigateToSubPage('settings/encoding')"
        class="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors"
      >
        Encoding
      </button>
      <button 
        @click="navigateToSubPage('settings/team')"
        class="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors"
      >
        Team
      </button>
    </div>
    
    <!-- Main Settings Content -->
    <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
      <h2 class="text-lg font-semibold text-zinc-100 mb-4">General Settings</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-zinc-300 mb-2">
            Default Project Location
          </label>
          <div class="flex gap-2">
            <input 
              type="text" 
              value="/Users/username/Projects"
              class="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100"
              readonly
            />
            <button class="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors">
              Browse
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-zinc-300 mb-2">
            Auto-save Interval
          </label>
          <select class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100">
            <option>Every 5 minutes</option>
            <option>Every 10 minutes</option>
            <option>Every 30 minutes</option>
            <option>Disabled</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouterStore } from '../../stores/router'

export default {
  name: 'SettingsPage',
  meta: {
    title: 'Settings',
    icon: 'settings'
  },
  setup() {
    const router = useRouterStore()
    
    const navigateToSubPage = (route) => {
      router.navigate(route)
    }
    
    return {
      navigateToSubPage
    }
  }
}
</script>