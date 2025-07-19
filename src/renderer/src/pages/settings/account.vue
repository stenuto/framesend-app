<template>
  <div class="p-6">
    <h2 class="text-lg font-semibold mb-4">Account Settings</h2>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Email</label>
        <input type="email" value="steve@example.com" 
          class="w-full px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Display Name</label>
        <input type="text" value="Steve Tenuto" 
          class="w-full px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AccountSettings'
}
</script>