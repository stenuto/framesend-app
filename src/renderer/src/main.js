import './assets/main.css'
import './assets/utilities.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

// Initialize mock user for development
import { useUserStore } from './stores/user'
const userStore = useUserStore()
userStore.initializeMockUser()

// Initialize settings store to apply dark mode
import { useSettingsStore } from './stores/settings'
const settingsStore = useSettingsStore()
