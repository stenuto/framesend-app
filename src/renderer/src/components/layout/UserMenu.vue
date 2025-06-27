<template>
  <div v-if="currentUser" class="relative">
    <!-- User Avatar Button -->
    <button @click="isOpen = !isOpen" 
      class="flex items-center gap-2 rounded-smooth-lg p-2 hover:bg-gray-100 transition-colors">
      <Avatar :src="currentUser.avatar" :name="currentUser.name" size="sm" />
      <div class="text-left">
        <div class="text-sm font-medium text-gray-900">{{ currentUser.name }}</div>
        <div class="text-xs text-gray-500">{{ currentUser.team.name }}</div>
      </div>
      <Icon name="chevron-down" size="sm" class="text-gray-400" />
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div v-if="isOpen" v-click-outside="closeMenu"
        class="absolute right-0 mt-2 w-64 rounded-smooth-lg bg-white shadow-lg border border-gray-200 py-1 z-50">
        
        <!-- User Info -->
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <Avatar :src="currentUser.avatar" :name="currentUser.name" />
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-900">{{ currentUser.name }}</div>
              <div class="text-xs text-gray-500">{{ currentUser.email }}</div>
            </div>
          </div>
        </div>

        <!-- Team Info -->
        <div class="px-4 py-3 border-b border-gray-200">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase">Team</span>
            <Badge :variant="teamPlan === 'pro' ? 'secondary' : 'default'" class="text-xs">
              {{ currentUser.team.planDetails.name }}
            </Badge>
          </div>
          <div class="text-sm font-medium text-gray-900">{{ currentUser.team.name }}</div>
          <div class="text-xs text-gray-500 mt-1">
            {{ currentUser.team.memberCount }} members
          </div>
        </div>

        <!-- Menu Items -->
        <div class="py-1">
          <button @click="navigateTo('profile')" 
            class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3">
            <Icon name="user" size="sm" />
            Profile Settings
          </button>
          
          <button v-if="isAdmin" @click="navigateTo('team')" 
            class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3">
            <Icon name="users" size="sm" />
            Team Settings
          </button>
          
          <button @click="navigateTo('billing')" 
            class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3">
            <Icon name="credit-card" size="sm" />
            Billing & Plan
          </button>
        </div>

        <!-- Logout -->
        <div class="border-t border-gray-200 py-1">
          <button @click="handleLogout" 
            class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3">
            <Icon name="log-out" size="sm" />
            Sign Out
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'
import { storeToRefs } from 'pinia'
import Avatar from '../base/Avatar.vue'
import Badge from '../base/Badge.vue'
import Icon from '../base/Icon.vue'

const userStore = useUserStore()
const { currentUser, isAdmin, teamPlan } = storeToRefs(userStore)

const isOpen = ref(false)

const closeMenu = () => {
  isOpen.value = false
}

const navigateTo = (page) => {
  // Handle navigation
  console.log('Navigate to:', page)
  closeMenu()
}

const handleLogout = async () => {
  await userStore.logout()
  closeMenu()
  // Redirect to login page
}

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>