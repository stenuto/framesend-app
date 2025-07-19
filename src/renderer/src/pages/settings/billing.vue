<template>
  <div class="p-6">
    <h2 class="text-lg font-semibold mb-4">Billing Settings</h2>
    <div class="space-y-4">
      <div class="p-4 bg-zinc-800 rounded-md">
        <h3 class="font-medium mb-2">Current Plan</h3>
        <p class="text-sm text-zinc-400">Pro Plan - $29/month</p>
      </div>
      <div>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Manage Subscription
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BillingSettings'
}
</script>