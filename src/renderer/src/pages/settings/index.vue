<template>
<div class="flex flex-col h-full pl-5">
  <!-- Settings Header with Tabs -->
  <div class="shrink-0">
    <!-- Title -->
    <div class="py-5">
      <h1 class="font-semibold text-lg">
        Settings
      </h1>
    </div>

    <!-- Horizontal Tab Navigation -->
    <nav class="flex gap-2 border-b border-zinc-700/50 pb-2.5">
      <button v-for="item in navigationItems" :key="item.id" :class="[
        'group flex items-center gap-1.5 px-1.5 py-[3px] text-xs font-regular rounded-smooth-md transition-colors',
        currentSection === item.id
          ? 'bg-zinc-400/15 text-zinc-50'
          : 'hover:text-zinc-50 text-zinc-400'
      ]" @click="navigateToSection(item.id)">
        <Icon v-if="item.icon" :name="item.icon" stroke-width="1.5" :class="[
          'size-3.5 flex-shrink-0',
          currentSection === item.id ? '' : 'text-zinc-500 group-hover:text-zinc-50'
        ]" />
        <span :class="[
          currentSection === item.id ? 'text-current' : 'group-hover:text-current'
        ]">
          {{ item.label }}
        </span>
      </button>
    </nav>
  </div>

  <!-- Content Area -->
  <div class="flex-1 overflow-y-auto pt-5 pr-5">
    <component :is="currentComponent" v-if="currentComponent" class="max-w-3xl" />
  </div>
</div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouterStore } from '@/stores/router'
import GeneralSettings from './general.vue'
import EncodingSettings from './encoding.vue'
import CaptionsSettings from './captions.vue'
import AccountSettings from './account.vue'
import Icon from '@components/base/Icon.vue'

export default {
  name: 'SettingsPage',
  components: {
    GeneralSettings,
    EncodingSettings,
    CaptionsSettings,
    AccountSettings,
    Icon
  },
  meta: {
    title: 'Settings'
  },
  setup() {
    const router = useRouterStore()
    const currentSection = ref('general')

    const navigationItems = [
      { id: 'general', label: 'General', icon: 'settings' },
      { id: 'encoding', label: 'Encoding', icon: 'tv-minimal-play' },
      { id: 'captions', label: 'Captions', icon: 'message-square-quote' },
      { id: 'account', label: 'Account', icon: 'user' }
    ]

    const currentComponent = computed(() => {
      const componentMap = {
        general: 'GeneralSettings',
        encoding: 'EncodingSettings',
        captions: 'CaptionsSettings',
        account: 'AccountSettings'
      }
      return componentMap[currentSection.value]
    })

    const navigateToSection = (sectionId) => {
      currentSection.value = sectionId
      // Also update the router for proper history tracking
      router.navigateTo(`settings/${sectionId}`)
    }

    const updateSectionFromRoute = () => {
      // Check if we have a sub-page in the route
      const subPage = router.currentSubPage
      if (subPage && navigationItems.some(item => item.id === subPage)) {
        currentSection.value = subPage
      } else if (router.currentPage === 'settings') {
        // Default to general settings if on settings page without subpage
        currentSection.value = 'general'
      }
    }

    // Watch for route changes
    watch(() => router.currentRoute, () => {
      updateSectionFromRoute()
    })

    onMounted(() => {
      updateSectionFromRoute()
      // Default to general if no subpage specified
      if (router.currentPage === 'settings' && !router.currentSubPage) {
        currentSection.value = 'general'
        // Don't navigate here to avoid creating duplicate history entries
      }
    })

    return {
      currentSection,
      navigationItems,
      currentComponent,
      navigateToSection
    }
  }
}
</script>