<template>
  <nav class="drag h-9 flex items-center border-b border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-900 w-full shrink-0 pl-24 pr-3 items-center">
    <div class="flex-1 flex items-center justify-center" />
    <div class="flex items-center gap-0.5">
      <Button 
        variant="ghost" 
        :iconName="darkMode ? 'sun' : 'moon'" 
        @click="toggleDarkMode"
        class="dark:hover:bg-zinc-800 dark:text-zinc-300"
      />
      <Button variant="ghost" iconName="chart-no-axes-combined" class="dark:hover:bg-zinc-800 dark:text-zinc-300" />
      <Button variant="ghost" iconName="cloud" class="dark:hover:bg-zinc-800 dark:text-zinc-300" />
      <Button variant="ghost" iconName="settings" class="dark:hover:bg-zinc-800 dark:text-zinc-300" />
    </div>
  </nav>
</template>

<script setup>
import Button from '../base/Button.vue'
import { useSettingsStore } from '../../stores/settings'
import { storeToRefs } from 'pinia'

const settingsStore = useSettingsStore()
const { darkMode } = storeToRefs(settingsStore)
const { toggleDarkMode } = settingsStore
</script>