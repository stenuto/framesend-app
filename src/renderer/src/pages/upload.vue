<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-zinc-700">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-zinc-100">Upload Files</h1>
        <button
          @click="handleSignOut"
          class="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Drag and Drop Area (Top Half) -->
      <div class="flex-1 p-6">
        <div
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          @dragleave="isDragging = false"
          @dragenter="isDragging = true"
          :class="[
            'h-full border-2 border-dashed rounded-lg transition-colors',
            'flex flex-col items-center justify-center',
            isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-600 bg-zinc-900'
          ]"
        >
          <svg class="w-16 h-16 text-zinc-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p class="text-zinc-300 text-lg mb-2">
            {{ isDragging ? 'Drop files here' : 'Drag and drop files here' }}
          </p>
          <p class="text-zinc-500 text-sm mb-4">or</p>
          
          <label class="cursor-pointer">
            <input
              type="file"
              multiple
              @change="handleFileSelect"
              class="hidden"
            />
            <span class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-colors">
              Browse Files
            </span>
          </label>
        </div>
      </div>
      
      <!-- Queue (Bottom Half) -->
      <div class="flex-1 border-t border-zinc-700">
        <div class="h-full flex flex-col">
          <!-- Queue Header -->
          <div class="px-6 py-3 border-b border-zinc-700 flex items-center justify-between">
            <h2 class="text-sm font-medium text-zinc-300">
              Upload Queue ({{ queue.length }} {{ queue.length === 1 ? 'file' : 'files' }})
            </h2>
            <button
              v-if="queue.length > 0"
              @click="clearQueue"
              class="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <!-- Queue List -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="queue.length === 0" class="h-full flex items-center justify-center">
              <p class="text-zinc-500">No files in queue</p>
            </div>
            
            <div v-else class="p-4 space-y-2">
              <div
                v-for="file in queue"
                :key="file.id"
                class="bg-zinc-900 border border-zinc-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-zinc-100 truncate">{{ file.name }}</p>
                    <p class="text-xs text-zinc-500">{{ formatFileSize(file.size) }}</p>
                  </div>
                  <button
                    @click="removeFromQueue(file.id)"
                    class="ml-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <!-- Progress Bar -->
                <div v-if="file.status === 'uploading'" class="mt-2">
                  <div class="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span>{{ file.progress }}%</span>
                    <span>{{ file.status }}</span>
                  </div>
                  <div class="h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-amber-500 transition-all duration-300"
                      :style="{ width: `${file.progress}%` }"
                    />
                  </div>
                </div>
                
                <!-- Status -->
                <div v-else class="mt-2 flex items-center text-xs">
                  <span
                    :class="[
                      'capitalize',
                      file.status === 'completed' ? 'text-green-500' : 
                      file.status === 'error' ? 'text-red-500' : 
                      'text-zinc-500'
                    ]"
                  >
                    {{ file.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Upload Button -->
          <div v-if="queue.length > 0" class="p-4 border-t border-zinc-700">
            <button
              @click="startUpload"
              :disabled="isUploading"
              class="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-medium rounded-md transition-colors"
            >
              {{ isUploading ? 'Uploading...' : 'Start Upload' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouterStore } from '../stores/router'

export default {
  name: 'UploadPage',
  meta: {
    title: 'Upload',
    icon: 'upload'
  },
  setup() {
    const router = useRouterStore()
    const isDragging = ref(false)
    const queue = ref([])
    const isUploading = ref(false)
    let fileIdCounter = 0
    
    const handleDrop = (e) => {
      e.preventDefault()
      isDragging.value = false
      
      const files = Array.from(e.dataTransfer.files)
      addFilesToQueue(files)
    }
    
    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files)
      addFilesToQueue(files)
    }
    
    const addFilesToQueue = (files) => {
      const newFiles = files.map(file => ({
        id: ++fileIdCounter,
        name: file.name,
        size: file.size,
        file: file,
        status: 'pending',
        progress: 0
      }))
      
      queue.value.push(...newFiles)
    }
    
    const removeFromQueue = (id) => {
      queue.value = queue.value.filter(file => file.id !== id)
    }
    
    const clearQueue = () => {
      queue.value = []
    }
    
    const startUpload = async () => {
      isUploading.value = true
      
      // Simulate upload process
      for (const file of queue.value) {
        if (file.status !== 'pending') continue
        
        file.status = 'uploading'
        
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
          file.progress = i
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Randomly succeed or fail for demo
        file.status = Math.random() > 0.2 ? 'completed' : 'error'
      }
      
      isUploading.value = false
    }
    
    const formatFileSize = (bytes) => {
      const sizes = ['B', 'KB', 'MB', 'GB']
      if (bytes === 0) return '0 B'
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
    }
    
    const handleSignOut = () => {
      router.navigateTo('signin')
    }
    
    return {
      isDragging,
      queue,
      isUploading,
      handleDrop,
      handleFileSelect,
      removeFromQueue,
      clearQueue,
      startUpload,
      formatFileSize,
      handleSignOut
    }
  }
}
</script>