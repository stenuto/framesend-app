import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useVideoEncodingStore } from './videoEncoding'

export const useQueueStore = defineStore('queue', () => {
  // State
  const queue = ref([])
  const fileIdCounter = ref(0)
  
  // Get video store
  const videoStore = useVideoEncodingStore()
  
  // Computed
  const activeJobs = computed(() => {
    return queue.value.filter(item => 
      item.status === 'encoding' || item.status === 'queued'
    )
  })
  
  const completedJobs = computed(() => {
    return queue.value.filter(item => item.status === 'completed')
  })
  
  const failedJobs = computed(() => {
    return queue.value.filter(item => 
      item.status === 'error' || item.status === 'invalid'
    )
  })
  
  const totalProgress = computed(() => {
    const active = activeJobs.value
    if (active.length === 0) return 0
    
    const sum = active.reduce((acc, item) => acc + (item.progress || 0), 0)
    return Math.round(sum / active.length)
  })
  
  // Actions
  function addToQueue(files) {
    const newFiles = files.map(file => ({
      id: ++fileIdCounter.value,
      name: file.name,
      size: file.size,
      path: file.path,
      file: file.file || file,
      isTemp: file.isTemp || false,
      status: 'pending',
      progress: 0,
      validation: null,
      jobId: null,
      warnings: file.warnings || []
    }))
    
    queue.value.push(...newFiles)
    return newFiles
  }
  
  function updateQueueItem(id, updates) {
    const index = queue.value.findIndex(item => item.id === id)
    if (index !== -1) {
      queue.value[index] = { ...queue.value[index], ...updates }
    }
  }
  
  function batchUpdateQueueItems(updates) {
    // Create a map for faster lookups
    const updateMap = new Map(updates.map(u => [u.id, u.updates]))
    
    // Update all items in a single pass
    queue.value = queue.value.map(item => {
      const itemUpdates = updateMap.get(item.id)
      return itemUpdates ? { ...item, ...itemUpdates } : item
    })
  }
  
  function removeFromQueue(id) {
    const index = queue.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const item = queue.value[index]
      
      // Cancel job if it's running
      if (item.jobId && (item.status === 'encoding' || item.status === 'queued')) {
        videoStore.cancelJob(item.jobId)
      }
      
      // Clean up temp file if needed
      if (item.isTemp && item.path) {
        window.api.file.cleanTemp(item.path).catch(console.error)
      }
      
      queue.value.splice(index, 1)
    }
  }
  
  function clearQueue() {
    // Cancel all active jobs
    for (const item of queue.value) {
      if (item.jobId && (item.status === 'encoding' || item.status === 'queued')) {
        videoStore.cancelJob(item.jobId)
      }
      if (item.isTemp && item.path) {
        window.api.file.cleanTemp(item.path).catch(console.error)
      }
    }
    
    queue.value = []
    fileIdCounter.value = 0
  }
  
  function findByJobId(jobId) {
    return queue.value.find(item => item.jobId === jobId)
  }
  
  function syncWithVideoStore() {
    // Update queue items based on video store state
    for (const [jobId, job] of videoStore.jobs) {
      const queueItem = findByJobId(jobId)
      if (queueItem) {
        queueItem.progress = job.progress
        queueItem.status = job.status === 'complete' ? 'completed' : 
                          job.status === 'error' ? 'error' : 
                          job.status === 'cancelled' ? 'cancelled' :
                          'encoding'
        
        if (job.error) {
          queueItem.error = job.error
        }
      }
    }
  }
  
  return {
    // State
    queue,
    fileIdCounter,
    
    // Computed
    activeJobs,
    completedJobs,
    failedJobs,
    totalProgress,
    
    // Actions
    addToQueue,
    updateQueueItem,
    batchUpdateQueueItems,
    removeFromQueue,
    clearQueue,
    findByJobId,
    syncWithVideoStore
  }
})