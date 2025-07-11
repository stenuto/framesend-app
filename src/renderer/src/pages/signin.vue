<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md px-6">
      <h1 class="text-2xl font-bold text-zinc-100 text-center mb-8">
Sign In
</h1>
      <form class="space-y-6" @submit.prevent="handleSignIn">
        <div>
          <label class="block text-sm font-medium text-zinc-300 mb-2">
            Email
          </label>
          <input v-model="email" type="email" required
            class="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="you@example.com" >
        </div>

        <div>
          <label class="block text-sm font-medium text-zinc-300 mb-2">
            Password
          </label>
          <input v-model="password" type="password" required
            class="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="••••••••" >
        </div>

        <div class="flex items-center justify-between">
          <label class="flex items-center">
            <input v-model="rememberMe" type="checkbox"
              class="w-4 h-4 bg-zinc-800 border-zinc-600 rounded text-emerald-500 focus:ring-emerald-500" >
            <span class="ml-2 text-sm text-zinc-400">Remember me</span>
          </label>

          <a href="#" class="text-sm text-emerald-500 hover:text-emerald-400">
            Forgot password?
          </a>
        </div>

        <button type="submit" :disabled="isLoading"
          class="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900">
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-zinc-400">
          Don't have an account?
          <a href="#" class="text-emerald-500 hover:text-emerald-400">Sign up</a>
        </p>
      </div>
</div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouterStore } from '../stores/router'

export default {
  name: 'SignInPage',
  meta: {
    title: 'Sign In',
    icon: 'user'
  },
  setup() {
    const router = useRouterStore()
    const email = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const isLoading = ref(false)

    const handleSignIn = async () => {
      isLoading.value = true

      // Simulate authentication
      setTimeout(() => {
        isLoading.value = false
        // Navigate to upload page after sign in
        router.navigateTo('upload')
      }, 1000)
    }

    return {
      email,
      password,
      rememberMe,
      isLoading,
      handleSignIn
    }
  }
}
</script>