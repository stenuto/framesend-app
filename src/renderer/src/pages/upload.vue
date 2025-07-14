<template>
  <div class="flex flex-col h-full p-4">

    <!-- Drag and Drop Area (Top Half) -->
    <div class="flex-1">
      <div :class="[
        'h-full border-2 border-zinc-300 dark:border-zinc-700 border-dashed rounded-smooth-md transition-colors',
        'flex flex-col items-center justify-center',
        isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'dark:border-zinc-700 border-zinc-300 bg-zinc-100 dark:bg-zinc-900/50'
      ]" @drop="handleDrop" @dragover.prevent @dragenter.prevent @dragleave="isDragging = false"
        @dragenter="isDragging = true">
        <Icon name="upload" class="size-6 text-zinc-500 dark:text-zinc-400 mb-4" />

        <p class="text-zinc-500 dark:text-zinc-300 text-sm mb-2">
          {{ isDragging ? 'Drop files here' : 'Drag and drop files here' }}
        </p>
        <p class="text-zinc-500 dark:text-zinc-300 text-sm mb-4">
          or
        </p>

        <Button variant="default" class-name="bg-cyan-500 hover:bg-cyan-600 text-white" @click="browseFiles">
          Browse Files
        </Button>
      </div>
    </div>

    <!-- Queue (Bottom Half) -->
    <div v-if="queue.length > 0" class=" border-t border-zinc-700">
      <div class="h-full flex flex-col">
        <!-- Queue Header -->
        <div class="px-6 py-3 border-b border-zinc-300 dark:border-zinc-700 flex items-center justify-between">
          <h2 class="text-sm font-medium text-zinc-300">
            Upload Queue ({{ queue.length }} {{ queue.length === 1 ? 'file' : 'files' }})
            <span v-if="activeJobs.length > 0" class="ml-2 text-xs text-cyan-500">
              • {{ activeJobs.length }} encoding
            </span>
          </h2>
          <Button v-if="queue.length > 0" size="sm" @click="clearQueue">
            Clear All
          </Button>
        </div>

        <!-- Queue List -->
        <div class="overflow-y-auto">
          <div v-if="queue.length === 0" class="h-full flex items-center justify-center">
            <p class="text-zinc-500 dark:text-zinc-400">
              No files in queue
            </p>
          </div>

          <div v-else class="p-4 space-y-2">
            <div v-for="file in queue" :key="file.id"
              class="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex-1 min-w-0 flex items-end">
                  <p class="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                    {{ file.name }}
                  </p>
                  <div class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-500">
                    <span>{{ formatFileSize(file.size) }}</span>
                  </div>
                </div>
                <Button icon-name="x" size="sm" class-name="ml-4" @click="removeFromQueue(file.id)" />
              </div>

              <!-- Progress Bar -->
              <div v-if="file.status === 'encoding' || file.status === 'queued'" class="mt-2">
                <div class="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-500 mb-1">
                  <span>{{ Math.round(file.progress) }}%</span>
                  <span class="capitalize">{{ file.status }}</span>
                </div>
                <div class="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div class="h-full bg-cyan-500 transition-all duration-300" :style="{ width: `${file.progress}%` }" />
                </div>
              </div>

              <!-- Status -->
              <div v-else class="mt-2 flex items-center justify-between text-xs">
                <span :class="[
                  'capitalize',
                  file.status === 'completed' ? 'text-green-600 dark:text-green-500' :
                    file.status === 'error' || file.status === 'invalid' ? 'text-red-600 dark:text-red-500' :
                      file.validation?.isValid ? 'text-green-600 dark:text-green-500' :
                        'text-zinc-600 dark:text-zinc-500'
                ]">
                  {{ file.validation?.isValid && file.status === 'pending' ? 'Ready to encode' : file.status }}
                  <span v-if="file.error" class="normal-case ml-1">({{ file.error }})</span>
                  <span v-if="file.warnings && file.warnings.length > 0"
                    class="normal-case ml-1 text-yellow-600 dark:text-yellow-500">({{
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
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useRouterStore } from '../stores/router'
import { useVideoEncodingStore } from '../stores/videoEncoding'
import { useQueueStore } from '../stores/queue'
import Icon from '@components/base/Icon.vue'
import Button from '@components/base/Button.vue'
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
    const queueStore = useQueueStore()
    const isDragging = ref(false)
    const validationErrors = ref([])

    // Computed properties
    const queue = computed(() => queueStore.queue)
    const activeJobs = computed(() => queueStore.activeJobs)
    const completedJobs = computed(() => queueStore.completedJobs)
    const failedJobs = computed(() => queueStore.failedJobs)
    const totalProgress = computed(() => queueStore.totalProgress)
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

      // Add files to queue store
      const newFiles = queueStore.addToQueue(videoFiles)

      // Process files in batches for better performance
      const BATCH_SIZE = 10
      const batches = []
      for (let i = 0; i < newFiles.length; i += BATCH_SIZE) {
        batches.push(newFiles.slice(i, i + BATCH_SIZE))
      }

      // Process each batch
      for (const batch of batches) {
        // Filter out items without paths
        const itemsWithPaths = batch.filter(item => item.path)
        const itemsWithoutPaths = batch.filter(item => !item.path)

        // Handle items without paths
        if (itemsWithoutPaths.length > 0) {
          const noPathUpdates = itemsWithoutPaths.map(item => ({
            id: item.id,
            updates: {
              status: 'error',
              error: 'File path not available - please use Browse Files button'
            }
          }))
          queueStore.batchUpdateQueueItems(noPathUpdates)
        }

        // Skip if no items with paths
        if (itemsWithPaths.length === 0) continue

        // Batch validate all files with paths
        const filePaths = itemsWithPaths.map(item => item.path)
        const batchResult = await window.api.video.validateBatch(filePaths)

        if (!batchResult.success) {
          // Handle batch validation failure
          const failureUpdates = itemsWithPaths.map(item => ({
            id: item.id,
            updates: {
              status: 'error',
              error: batchResult.error
            }
          }))
          queueStore.batchUpdateQueueItems(failureUpdates)
          continue
        }

        // Process validation results and queue valid files
        const updates = []
        const validFiles = []

        for (let i = 0; i < itemsWithPaths.length; i++) {
          const queueItem = itemsWithPaths[i]
          const validationResult = batchResult.data[i]

          if (!validationResult.success) {
            updates.push({
              id: queueItem.id,
              updates: {
                status: 'error',
                error: validationResult.error
              }
            })
          } else {
            const validation = validationResult.data
            const itemUpdates = { validation }

            if (!validation.isValid) {
              itemUpdates.status = 'invalid'
              itemUpdates.error = validation.errors.join(', ')
            } else {
              if (validation.warnings && validation.warnings.length > 0) {
                itemUpdates.warnings = validation.warnings
              }
              validFiles.push({ queueItem, validation })
            }

            updates.push({ id: queueItem.id, updates: itemUpdates })
          }
        }

        // Batch update with validation results
        queueStore.batchUpdateQueueItems(updates)

        // Queue valid files for encoding
        const encodingUpdates = []
        for (const { queueItem } of validFiles) {
          try {
            const job = await videoStore.queueVideo(queueItem)
            encodingUpdates.push({
              id: queueItem.id,
              updates: {
                jobId: job.id,
                status: 'queued'
              }
            })
          } catch (error) {
            encodingUpdates.push({
              id: queueItem.id,
              updates: {
                status: 'error',
                error: error.message
              }
            })
          }
        }

        // Batch update with encoding results
        if (encodingUpdates.length > 0) {
          queueStore.batchUpdateQueueItems(encodingUpdates)
        }
      }

      // Start a single progress watcher for all jobs
      startProgressWatcher()
    }

    const removeFromQueue = async (id) => {
      await queueStore.removeFromQueue(id)
    }

    const clearQueue = async () => {
      await queueStore.clearQueue()
    }

    // Single progress watcher for all jobs
    let progressWatcherInterval = null

    const startProgressWatcher = () => {
      // Don't start multiple watchers
      if (progressWatcherInterval) return

      progressWatcherInterval = setInterval(() => {
        const updates = []
        let hasActiveJobs = false

        // Check all queue items with jobs
        for (const queueItem of queue.value) {
          if (queueItem.jobId) {
            const job = videoStore.jobs.get(queueItem.jobId)
            if (job) {
              hasActiveJobs = true

              // Prepare update if needed
              const newStatus = job.status === 'complete' ? 'completed' :
                job.status === 'error' ? 'error' :
                  job.status === 'cancelled' ? 'cancelled' :
                    job.status === 'queued' ? 'queued' :
                      'encoding'

              if (queueItem.progress !== job.progress || queueItem.status !== newStatus) {
                updates.push({
                  id: queueItem.id,
                  updates: {
                    progress: job.progress,
                    status: newStatus
                  }
                })
              }
            }
          }
        }

        // Batch update if there are changes
        if (updates.length > 0) {
          queueStore.batchUpdateQueueItems(updates)
        }

        // Stop watcher if no active jobs
        if (!hasActiveJobs && progressWatcherInterval) {
          clearInterval(progressWatcherInterval)
          progressWatcherInterval = null
        }
      }, 1000)
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

          // Remove from queue
          await queueStore.removeFromQueue(file.id)

          // Remove from video store
          videoStore.removeJob(file.jobId);

        } catch (error) {
          console.error('Failed to cancel job:', error)
          alert(`Failed to cancel job: ${error.message}`)
        }
      }
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


    // Sync with active jobs on mount
    onMounted(() => {
      // Sync queue with any active jobs from video store
      queueStore.syncWithVideoStore()

      // Start the progress watcher if there are active jobs
      const hasActiveJobs = queue.value.some(item =>
        item.jobId && (item.status === 'encoding' || item.status === 'queued')
      )
      if (hasActiveJobs) {
        startProgressWatcher()
      }
    })

    // Expose for debugging
    window.__videoStore = videoStore;
    window.__queueStore = queueStore;

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
      // Stop the progress watcher
      if (progressWatcherInterval) {
        clearInterval(progressWatcherInterval)
        progressWatcherInterval = null
      }

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

      // Video store methods
      pauseQueue: videoStore.pauseQueue,
      resumeQueue: videoStore.resumeQueue,
      cancelJob: videoStore.cancelJob
    }
  }
}
</script>