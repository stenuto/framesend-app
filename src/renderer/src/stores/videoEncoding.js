import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useUserStore } from './user';
import { useProjectsStore } from './projects';

export const useVideoEncodingStore = defineStore('videoEncoding', () => {
  const userStore = useUserStore();
  const projectsStore = useProjectsStore();
  
  // State
  const jobs = ref(new Map()); // Map of jobId -> job data
  const queueStatus = ref({
    pending: 0,
    active: 0,
    isPaused: false,
  });

  // Event cleanup functions
  const eventCleanups = ref({
    progress: null,
    complete: null,
    error: null,
  });

  // Getters
  const allJobs = computed(() => Array.from(jobs.value.values()));
  
  const activeJobs = computed(() => 
    allJobs.value.filter(job => job.status === 'processing')
  );
  
  const completedJobs = computed(() => 
    allJobs.value.filter(job => job.status === 'ready')
  );
  
  const failedJobs = computed(() => 
    allJobs.value.filter(job => job.status === 'failed')
  );
  
  const totalProgress = computed(() => {
    const jobsList = allJobs.value;
    if (jobsList.length === 0) return 0;
    
    const totalProgress = jobsList.reduce((sum, job) => sum + (job.progress || 0), 0);
    return totalProgress / jobsList.length;
  });
  
  // Calculate total storage used in GB
  const totalStorageUsedGB = computed(() => {
    let totalBytes = 0;
    
    // Sum up all videos from fileSystem that have encoded sizes
    if (projectsStore.fileSystem) {
      projectsStore.fileSystem.forEach(item => {
        if (item.type === 'video' && item.status === 'ready' && item.encodedSize) {
          totalBytes += item.encodedSize;
        }
      });
    }
    
    // Add currently encoding videos from jobs
    allJobs.value.forEach(job => {
      if (job.status === 'processing' && job.encodedSize) {
        // Currently encoding - use current encoded size from progress
        totalBytes += job.encodedSize;
      }
    });
    
    // Convert bytes to GB
    return totalBytes / (1024 * 1024 * 1024);
  });

  // Actions
  
  /**
   * Initialize event listeners for encoding updates
   */
  function initializeListeners() {
    // Clean up existing listeners
    cleanupListeners();
    
    // Start listener
    console.log('[VideoStore] Setting up start listener, onStart available:', !!window.api.video.onStart);
    if (window.api.video.onStart) {
      eventCleanups.value.start = window.api.video.onStart((data) => {
        console.log('[VideoStore] Received start event for job:', data.jobId, data);
        const job = jobs.value.get(data.jobId);
        if (job) {
          job.status = 'processing'; // Changed from 'encoding' to 'processing'
          job.startedAt = new Date();
          console.log('[VideoStore] Updated job status to processing');
        } else {
          console.warn('[VideoStore] Could not find job for start event:', data.jobId);
        }
      });
    } else {
      console.warn('[VideoStore] No onStart listener available!');
    }

    // Progress listener
    eventCleanups.value.progress = window.api.video.onProgress((data) => {
      const job = jobs.value.get(data.jobId);
      if (job) {
        job.progress = data.global * 100;
        job.stages = data.stages;
        job.currentStage = data.currentStage;
        job.details = data.details;
        job.status = 'processing'; // Changed from 'encoding' to 'processing'
        
        // Update encoded size if available
        if (data.encodedSize !== undefined && data.encodedSize > 0) {
          job.encodedSize = data.encodedSize;
        }
        
        // Log detailed stage information
        if (data.currentStage) {
          const stageDescriptions = {
            probe: 'Analyzing video metadata',
            plan: 'Planning encoding strategy',
            audio: 'Extracting audio tracks',
            encode: 'Encoding video',
            assets: 'Generating thumbnails',
            captions: 'Generating captions',
            manifest: 'Creating HLS manifest',
            metadata: 'Writing metadata',
            finalize: 'Finalizing output'
          };
          
          // Clean, single-line progress updates
          const stageDesc = stageDescriptions[data.currentStage] || data.currentStage;
          const progress = Math.round(data.global * 100);
          
          if (data.currentStage === 'encode' && data.details?.currentRendition) {
            const renditionProgress = Math.round(data.details.renditionProgress * 100);
            console.log(`[${job.file.name}] ${stageDesc}: ${data.details.currentRendition} (${renditionProgress}%) - Total: ${progress}%`);
          } else {
            console.log(`[${job.file.name}] ${stageDesc} - ${progress}%`);
          }
          
          // Log stage completion only for major milestones
          if (data.stages) {
            const majorStages = ['encode', 'assets'];
            Object.entries(data.stages).forEach(([stage, stageData]) => {
              if (stageData.completed && !job.loggedStages?.[stage] && majorStages.includes(stage)) {
                console.log(`[${job.file.name}] ✓ ${stageDescriptions[stage] || stage} complete`);
                if (!job.loggedStages) job.loggedStages = {};
                job.loggedStages[stage] = true;
              }
            });
          }
        }
      } else {
        console.warn('Job not found in store:', data.jobId);
      }
    });

    // Complete listener
    eventCleanups.value.complete = window.api.video.onComplete((data) => {
      const job = jobs.value.get(data.jobId);
      if (job) {
        job.status = 'ready'; // Changed from 'complete' to 'ready'
        job.progress = 100;
        job.metadata = data.metadata;
        job.duration = data.duration;
        job.completedAt = new Date();
      }
    });

    // Error listener
    eventCleanups.value.error = window.api.video.onError((data) => {
      const job = jobs.value.get(data.jobId);
      if (job) {
        job.status = 'failed'; // Changed from 'error' to 'failed'
        job.error = data.error;
        job.failedAt = new Date();
      }
    });
    
    // Cancelled listener (if available)
    if (window.api.video.onCancelled) {
      eventCleanups.value.cancelled = window.api.video.onCancelled((data) => {
        console.log(`[VideoStore] Received cancelled event for job ${data.jobId}`);
        const job = jobs.value.get(data.jobId);
        if (job) {
          job.status = 'failed';
          job.error = 'Cancelled by user';
          job.cancelledAt = new Date();
        }
      });
    }
    
    // Thumbnail listener
    if (window.api.video.onThumbnail) {
      eventCleanups.value.thumbnail = window.api.video.onThumbnail((data) => {
        console.log(`[VideoStore] Received thumbnail for job ${data.jobId}:`, data);
        const job = jobs.value.get(data.jobId);
        if (job) {
          job.thumbnailPath = data.thumbnailPath;
          job.thumbnailIsTemporary = data.isTemporary;
          
          // Emit an event or update dependent stores
          // This allows the UI to immediately show the thumbnail
          console.log(`[VideoStore] Updated job ${data.jobId} with thumbnail path: ${data.thumbnailPath}`);
          console.log(`[${job.file.name}] Early thumbnail generated`);
        } else {
          console.warn(`[VideoStore] Could not find job ${data.jobId} in store`);
        }
      });
    }
  }

  /**
   * Clean up event listeners
   */
  function cleanupListeners() {
    Object.values(eventCleanups.value).forEach(cleanup => {
      if (cleanup) cleanup();
    });
  }

  /**
   * Validate a video file
   */
  async function validateVideo(fileOrPath) {
    // Handle both file objects and path strings
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath.path;
    
    if (!filePath) {
      throw new Error('No file path available');
    }
    
    const result = await window.api.video.validate(filePath);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  /**
   * Queue a video for encoding
   */
  async function queueVideo(fileOrPath) {
    // Handle both file objects and path strings
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath.path;
    const fileName = typeof fileOrPath === 'string' ? 
      filePath.split('/').pop() : 
      fileOrPath.name;
    const fileSize = typeof fileOrPath === 'string' ? 
      0 : 
      fileOrPath.size;
    
    if (!filePath) {
      throw new Error('No file path available');
    }
    
    // Validate first
    const validation = await validateVideo(filePath);
    
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Queue for encoding
    const result = await window.api.video.encode(filePath);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    // Add to local state
    const job = {
      id: result.data.id,
      file: {
        name: fileName,
        path: filePath,
        size: fileSize,
      },
      validation,
      status: 'queued',
      progress: 0,
      stages: {},
      queuedAt: new Date(),
    };

    jobs.value.set(job.id, job);
    
    // Update queue status
    await updateQueueStatus();
    
    return job;
  }

  /**
   * Queue multiple videos
   */
  async function queueMultipleVideos(files) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const job = await queueVideo(file);
        results.push(job);
      } catch (error) {
        errors.push({
          file: file.name,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }

  /**
   * Cancel a job
   */
  async function cancelJob(jobId) {
    console.log(`[VideoStore] Cancelling job ${jobId}`);
    const result = await window.api.video.cancel(jobId);
    
    if (!result.success) {
      console.error(`[VideoStore] Failed to cancel job ${jobId}:`, result.error);
      throw new Error(result.error);
    }
    
    console.log(`[VideoStore] Job ${jobId} cancelled successfully`);

    const job = jobs.value.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.cancelledAt = new Date();
    }

    await updateQueueStatus();
  }

  /**
   * Remove a job from the list
   */
  function removeJob(jobId) {
    jobs.value.delete(jobId);
  }

  /**
   * Clear completed jobs
   */
  function clearCompleted() {
    completedJobs.value.forEach(job => {
      jobs.value.delete(job.id);
    });
  }

  /**
   * Update queue status from service
   */
  async function updateQueueStatus() {
    const result = await window.api.video.getStatus();
    
    if (result.success) {
      queueStatus.value = {
        pending: result.data.pending,
        active: result.data.active,
        isPaused: queueStatus.value.isPaused,
      };
    }
  }

  /**
   * Pause encoding queue
   */
  async function pauseQueue() {
    const result = await window.api.video.pause();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    queueStatus.value.isPaused = true;
  }

  /**
   * Resume encoding queue
   */
  async function resumeQueue() {
    const result = await window.api.video.resume();
    
    if (!result.success) {
      throw new Error(result.error);
    }

    queueStatus.value.isPaused = false;
  }

  /**
   * Format file size
   */
  function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Format duration
   */
  function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Initialize listeners when store is created
  initializeListeners();
  
  // Watch total storage and update user store
  watch(totalStorageUsedGB, (newValue) => {
    userStore.updateStorageUsed(newValue);
  });

  return {
    // State
    jobs,
    queueStatus,
    
    // Getters
    allJobs,
    activeJobs,
    completedJobs,
    failedJobs,
    totalProgress,
    totalStorageUsedGB,
    
    // Actions
    validateVideo,
    queueVideo,
    queueMultipleVideos,
    cancelJob,
    removeJob,
    clearCompleted,
    updateQueueStatus,
    pauseQueue,
    resumeQueue,
    
    // Utilities
    formatFileSize,
    formatDuration,
    
    // Lifecycle
    cleanupListeners,
  };
});