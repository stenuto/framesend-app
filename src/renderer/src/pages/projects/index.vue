<template>
  <div class="projects-page p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-zinc-100">Projects</h1>
      <button class="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors">
        New Project
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Project Card -->
      <div 
        @click="router.navigate('projects/details')"
        class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-100">Marketing Campaign 2024</h3>
          <span class="px-2 py-1 text-xs font-medium text-green-400 bg-green-900/30 rounded">Active</span>
        </div>
        <p class="text-sm text-zinc-400 mb-4">Q1 marketing video assets and campaigns</p>
        <div class="flex items-center justify-between text-sm">
          <span class="text-zinc-400">12 videos</span>
          <span class="text-zinc-400">Updated 2h ago</span>
        </div>
      </div>
      
      <!-- Project Card -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 cursor-pointer hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-100">Product Demos</h3>
          <span class="px-2 py-1 text-xs font-medium text-green-400 bg-green-900/30 rounded">Active</span>
        </div>
        <p class="text-sm text-zinc-400 mb-4">Product demonstration videos and tutorials</p>
        <div class="flex items-center justify-between text-sm">
          <span class="text-zinc-400">8 videos</span>
          <span class="text-zinc-400">Updated 1d ago</span>
        </div>
      </div>
      
      <!-- Project Card -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 cursor-pointer hover:shadow-md transition-shadow opacity-75">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-zinc-100">Holiday Campaign</h3>
          <span class="px-2 py-1 text-xs font-medium text-zinc-400 bg-zinc-700 rounded">Archived</span>
        </div>
        <p class="text-sm text-zinc-400 mb-4">2023 holiday season promotional content</p>
        <div class="flex items-center justify-between text-sm">
          <span class="text-zinc-400">24 videos</span>
          <span class="text-zinc-400">Updated 2mo ago</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouterStore } from '../../stores/router'

export default {
  name: 'ProjectsPage',
  meta: {
    title: 'Projects',
    icon: 'folder'
  },
  setup() {
    const router = useRouterStore()
    return { router }
  }
}
</script>