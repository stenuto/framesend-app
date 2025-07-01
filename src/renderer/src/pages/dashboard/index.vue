<template>
  <div class="dashboard-page p-6">
    <h1 class="text-2xl font-bold text-zinc-100 mb-6">Dashboard</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Stats Card -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <h3 class="text-sm font-medium text-zinc-400 mb-2">Total Projects</h3>
        <p class="text-3xl font-semibold text-zinc-100">12</p>
        <p class="text-sm text-zinc-400 mt-2">3 active</p>
      </div>
      
      <!-- Stats Card -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <h3 class="text-sm font-medium text-zinc-400 mb-2">Total Videos</h3>
        <p class="text-3xl font-semibold text-zinc-100">48</p>
        <p class="text-sm text-zinc-400 mt-2">12 this week</p>
      </div>
      
      <!-- Stats Card -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <h3 class="text-sm font-medium text-zinc-400 mb-2">Storage Used</h3>
        <p class="text-3xl font-semibold text-zinc-100">24.5 GB</p>
        <p class="text-sm text-zinc-400 mt-2">of 100 GB</p>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold text-zinc-100 mb-4">Recent Activity</h2>
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700">
        <div class="p-4 border-b border-zinc-700">
          <p class="text-sm text-zinc-300">
            <span class="font-medium">Project Alpha</span> - New video uploaded
          </p>
          <p class="text-xs text-zinc-400 mt-1">2 hours ago</p>
        </div>
        <div class="p-4 border-b border-zinc-700">
          <p class="text-sm text-zinc-300">
            <span class="font-medium">Marketing Campaign</span> - Export completed
          </p>
          <p class="text-xs text-zinc-400 mt-1">5 hours ago</p>
        </div>
        <div class="p-4">
          <p class="text-sm text-zinc-300">
            <span class="font-medium">Product Demo</span> - Encoding finished
          </p>
          <p class="text-xs text-zinc-400 mt-1">1 day ago</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardPage',
  meta: {
    title: 'Dashboard',
    icon: 'dashboard'
  }
}
</script>