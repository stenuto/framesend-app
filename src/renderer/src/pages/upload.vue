<template>
  <div class="flex flex-col h-full">
    <!-- Drag and Drop Area (Top Half) -->
    <div class="flex-1">
      <div :class="[
        'h-full border-2 border-dashed rounded-smooth-md transition-colors',
        'flex flex-col items-center justify-center',
        isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700'
      ]" @drop="handleDrop" @dragover.prevent @dragenter.prevent @dragleave="isDragging = false"
        @dragenter="isDragging = true">
        <Icon name="upload" class="size-6 text-zinc-500 mb-4" />

        <p class="text-zinc-300 text-sm mb-2">
          {{ isDragging ? 'Drop files here' : 'Drag and drop files here' }}
        </p>
        <p class="text-zinc-500 text-sm mb-4">
          or
        </p>

        <Button variant="default" class-name="bg-cyan-500 hover:bg-cyan-600 text-white" @click="browseFiles">
          Browse Files
        </Button>
        
        <Button variant="ghost" class-name="mt-2" @click="testVideoAPI">
          Test API
        </Button>
      </div>
    </div>

    <!-- Queue (Bottom Half) -->
    <div v-if="queue.length > 0" class="flex-1 border-t border-zinc-700">
      <div class="h-full flex flex-col">
        <!-- Queue Header -->
        <div class="px-6 py-3 border-b border-zinc-700 flex items-center justify-between">
          <h2 class="text-sm font-medium text-zinc-300">
            Upload Queue ({{ queue.length }} {{ queue.length === 1 ? 'file' : 'files' }})
            <span v-if="activeJobs.length > 0" class="ml-2 text-xs text-cyan-500">
              • {{ activeJobs.length }} encoding
            </span>
          </h2>
          <Button v-if="queue.length > 0" variant="ghost" size="sm" @click="clearQueue">
            Clear All
          </Button>
        </div>

        <!-- Queue List -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="queue.length === 0" class="h-full flex items-center justify-center">
            <p class="text-zinc-500">No files in queue</p>
          </div>

          <div v-else class="p-4 space-y-2">
            <div v-for="file in queue" :key="file.id" class="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-zinc-100 truncate">{{ file.name }}</p>
                  <div class="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{{ formatFileSize(file.size) }}</span>
                    <span v-if="file.validation?.fileInfo?.mimeType" class="text-zinc-600">•</span>
                    <span v-if="file.validation?.fileInfo?.mimeType">{{
                      file.validation.fileInfo.mimeType.replace('video/', '') }}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" class-name="ml-4" @click="removeFromQueue(file.id)">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <!-- Progress Bar -->
              <div v-if="file.status === 'encoding' || file.status === 'queued'" class="mt-2">
                <div class="flex items-center justify-between text-xs text-zinc-500 mb-1">
                  <span>{{ Math.round(file.progress) }}%</span>
                  <span class="capitalize">{{ file.status }}</span>
                </div>
                <div class="h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div class="h-full bg-cyan-500 transition-all duration-300" :style="{ width: `${file.progress}%` }" />
                </div>
              </div>

              <!-- Status -->
              <div v-else class="mt-2 flex items-center justify-between text-xs">
                <span :class="[
                  'capitalize',
                  file.status === 'completed' ? 'text-green-500' :
                    file.status === 'error' || file.status === 'invalid' ? 'text-red-500' :
                      file.validation?.isValid ? 'text-green-500' :
                        'text-zinc-500'
                ]">
                  {{ file.validation?.isValid && file.status === 'pending' ? 'Ready to encode' : file.status }}
                  <span v-if="file.error" class="normal-case ml-1">({{ file.error }})</span>
                  <span v-if="file.warnings && file.warnings.length > 0" class="normal-case ml-1 text-yellow-500">({{
                    file.warnings.join(', ') }})</span>
                </span>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue'
import { useRouterStore } from '../stores/router'
import { useVideoEncodingStore } from '../stores/videoEncoding'
import Icon from '../components/base/Icon.vue'
import Button from '../components/base/Button.vue'
import '../debug-utils.js' // Import debug utilities

export default {
  name: 'UploadPage',
  components: {
    Icon,
    Button
  },
  meta: {
    title: 'Upload',
    icon: 'upload'
  },
  setup() {
    const router = useRouterStore()
    const videoStore = useVideoEncodingStore()
    const isDragging = ref(false)
    const queue = ref([])
    const validationErrors = ref([])
    let fileIdCounter = 0

    // Computed properties
    const activeJobs = computed(() => videoStore.activeJobs)
    const completedJobs = computed(() => videoStore.completedJobs)
    const failedJobs = computed(() => videoStore.failedJobs)
    const totalProgress = computed(() => videoStore.totalProgress)
    const isPaused = computed(() => videoStore.queueStatus.isPaused)

    const handleDrop = async (e) => {
      e.preventDefault()
      isDragging.value = false

      const files = Array.from(e.dataTransfer.files)
      const fileList = []

      for (const file of files) {
        // In Electron, the File object has a 'path' property
        const filePath = file.path || file.webkitRelativePath || null
        

        if (filePath) {
          // We have a path, use it directly
          fileList.push({
            name: file.name,
            size: file.size,
            path: filePath
          })
        } else {
          // Try another approach - use electron's webUtils if available
          if (window.electron && window.electron.webUtils && window.electron.webUtils.getPathForFile) {
            const path = window.electron.webUtils.getPathForFile(file)
            fileList.push({
              name: file.name,
              size: file.size,
              path: path
            })
          } else {
            console.error('No path available for file:', file.name)
          }
        }
      }

      if (fileList.length > 0) {
        await addFilesToQueue(fileList)
      }
    }

    const browseFiles = async () => {
      const files = await window.api.video.selectFiles()
      if (files) {
        await addFilesToQueue(files)
      }
    }
    
    // Test function to debug encoding service
    const testVideoAPI = async () => {
      console.log('Testing video API...');
      
      try {
        // Test basic handler
        console.log('Testing basic handler...');
        const testResult = await window.api.video.test();
        console.log('Test result:', testResult);
        
        // Test service creation
        console.log('Testing service creation...');
        const serviceResult = await window.api.video.testService();
        console.log('Service test result:', serviceResult);
        
      } catch (error) {
        console.error('Test error:', error);
      }
    }

    const addFilesToQueue = async (files) => {
      // For drag and drop, we get File objects
      // For browse, we get objects with path, name, size
      const normalizedFiles = files.map(file => {
        if (file.path) {
          // Already has path (from browse dialog)
          return file
        } else {
          // From drag and drop - File object might have path
          return {
            path: file.path || null,
            name: file.name,
            size: file.size,
            file: file
          }
        }
      })

      // Filter for video files only
      const videoFiles = normalizedFiles.filter(file => {
        const ext = file.name.toLowerCase().split('.').pop()
        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv']
        return videoExtensions.includes(ext)
      })

      if (videoFiles.length === 0) {
        validationErrors.value.push('Please select valid video files')
        return
      }

      // Clear previous errors
      validationErrors.value = []

      // Add files to local queue for preview
      const newFiles = videoFiles.map(file => ({
        id: ++fileIdCounter,
        name: file.name,
        size: file.size,
        path: file.path,
        file: file.file || file, // Use the File object if available, otherwise the normalized object
        isTemp: file.isTemp || false, // Track if this is a temporary file
        status: 'pending',
        progress: 0,
        validation: null,
        jobId: null
      }))

      queue.value.push(...newFiles)

      // Validate each file that has a path
      for (const queueItem of newFiles) {
        if (!queueItem.path) {
          queueItem.status = 'error'
          queueItem.error = 'File path not available - please use Browse Files button'
          continue
        }

        try {
          const validation = await videoStore.validateVideo(queueItem)
          queueItem.validation = validation

          if (!validation.isValid) {
            queueItem.status = 'invalid'
            queueItem.error = validation.errors.join(', ')
          } else {
            // File is valid, start encoding immediately
            if (validation.warnings && validation.warnings.length > 0) {
              queueItem.warnings = validation.warnings
            }

            // Start encoding this file
            try {
              queueItem.status = 'queuing'
              const job = await videoStore.queueVideo(queueItem)
              queueItem.jobId = job.id
              queueItem.status = 'queued'

              // Watch for this job's progress
              watchJobProgress(queueItem, job.id)
            } catch (error) {
              queueItem.status = 'error'
              queueItem.error = error.message
            }
          }
        } catch (error) {
          queueItem.status = 'error'
          queueItem.error = error.message
        }
      }
    }

    const removeFromQueue = async (id) => {
      const file = queue.value.find(f => f.id === id)
      
      if (!file) {
        return;
      }
      
      // If the file has a jobId and is being processed, cancel the job first
      if (file.jobId && (file.status === 'queued' || file.status === 'encoding')) {
        try {
          await videoStore.cancelJob(file.jobId);
          // Remove from video store
          videoStore.removeJob(file.jobId);
        } catch (error) {
          console.error('Failed to cancel job:', error);
          // Continue with removal even if cancel fails
        }
      }
      
      // Clean up temporary file
      if (file.isTemp && file.path) {
        await window.api.file.cleanTemp(file.path)
      }
      
      // Remove from queue
      queue.value = queue.value.filter(f => f.id !== id)
    }

    const clearQueue = async () => {
      // Cancel all active jobs first
      for (const file of queue.value) {
        if (file.jobId && (file.status === 'queued' || file.status === 'encoding')) {
          try {
            await videoStore.cancelJob(file.jobId);
            videoStore.removeJob(file.jobId);
          } catch (error) {
            console.error('Failed to cancel job:', error);
          }
        }
        
        // Clean up temporary files
        if (file.isTemp && file.path) {
          await window.api.file.cleanTemp(file.path)
        }
      }
      
      queue.value = []
    }

    const handleCancelJob = async (file) => {
      if (!file.jobId) {
        alert('Cannot cancel: No job ID found for this file');
        return;
      }
      
      const message = `Are you sure you want to cancel "${file.name}"?`;
      
      if (confirm(message)) {
        try {
          // Use the regular cancel which now includes aggressive process killing
          await videoStore.cancelJob(file.jobId);
          
          // Remove from queue immediately
          queue.value = queue.value.filter(item => item.jobId !== file.jobId)
          
          // Remove from video store
          videoStore.removeJob(file.jobId);
          
        } catch (error) {
          console.error('Failed to cancel job:', error)
          alert(`Failed to cancel job: ${error.message}`)
        }
      }
    }


    // Watch encoding progress for a specific queue item
    const watchJobProgress = (queueItem, jobId) => {
      const checkInterval = setInterval(() => {
        const job = videoStore.jobs.get(jobId)

        if (!job) {
          clearInterval(checkInterval)
          return
        }

        // Update queue item with job progress
        const itemIndex = queue.value.findIndex(item => item.id === queueItem.id)
        if (itemIndex !== -1) {
          queue.value[itemIndex] = {
            ...queue.value[itemIndex],
            progress: job.progress || 0,
            status: job.status,
            jobId: jobId // Preserve the jobId
          }
        }

        if (job.status === 'complete') {
          const itemIndex = queue.value.findIndex(item => item.id === queueItem.id)
          if (itemIndex !== -1) {
            queue.value[itemIndex] = {
              ...queue.value[itemIndex],
              status: 'completed',
              metadata: job.metadata,
              jobId: jobId // Preserve the jobId
            }
          }
          clearInterval(checkInterval)
        } else if (job.status === 'error') {
          const itemIndex = queue.value.findIndex(item => item.id === queueItem.id)
          if (itemIndex !== -1) {
            queue.value[itemIndex] = {
              ...queue.value[itemIndex],
              status: 'error',
              error: job.error?.message || 'Encoding failed',
              jobId: jobId // Preserve the jobId
            }
          }
          clearInterval(checkInterval)
        }
      }, 1000)
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
    
    
    // Expose for debugging
    window.__videoStore = videoStore;
    window.__queue = queue;
    
    // Debug function to check process status
    window.checkProcesses = async () => {
      const status = await window.api.video.processStatus();
      console.log('=== Process Status ===');
      console.log('Summary:', status.data.summary);
      console.log('Manager tracking:', status.data.manager);
      console.log('Running FFmpeg processes:');
      status.data.running.forEach(p => {
        console.log(`  ${p.isOurs ? '★' : '○'} PID ${p.pid}: ${p.command.substring(0, 100)}...`);
      });
      return status.data;
    };
    
    // Debug function to test fluent-ffmpeg kill
    window.testKill = async () => {
      console.log('Testing fluent-ffmpeg kill...');
      const result = await window.api.video.testKill();
      console.log('Test result:', result);
      return result;
    };

    // Cleanup on unmount
    onUnmounted(async () => {
      // Clean up any temporary files
      for (const file of queue.value) {
        if (file.isTemp && file.path) {
          await window.api.file.cleanTemp(file.path)
        }
      }
      // Store cleanup is handled by the store itself
    })

    return {
      // State
      isDragging,
      queue,
      validationErrors,

      // Computed
      activeJobs,
      completedJobs,
      failedJobs,
      totalProgress,
      isPaused,

      // Methods
      handleDrop,
      browseFiles,
      removeFromQueue,
      clearQueue,
      formatFileSize,
      handleSignOut,
      handleCancelJob,
      testVideoAPI,

      // Video store methods
      pauseQueue: videoStore.pauseQueue,
      resumeQueue: videoStore.resumeQueue,
      cancelJob: videoStore.cancelJob
    }
  }
}
</script>