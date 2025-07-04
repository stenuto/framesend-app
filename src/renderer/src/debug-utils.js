// Debug utilities for the renderer process

export function debugVideoStore() {
  const videoStore = window.__videoStore;
  if (!videoStore) {
    console.error('Video store not found. Make sure to set window.__videoStore = videoStore in your component');
    return;
  }
  
  console.log('=== Video Store Debug Info ===');
  console.log('Jobs in store:', videoStore.jobs.size);
  
  videoStore.jobs.forEach((job, id) => {
    console.log(`Job ${id}:`, {
      status: job.status,
      progress: job.progress,
      file: job.file?.name,
      queuedAt: job.queuedAt
    });
  });
  
  console.log('Queue status:', videoStore.queueStatus);
  console.log('Active jobs:', videoStore.activeJobs.length);
}

export function debugQueue() {
  const queue = window.__queue;
  if (!queue) {
    console.error('Queue not found. Make sure to set window.__queue = queue in your component');
    return;
  }
  
  console.log('=== Queue Debug Info ===');
  console.log('Queue items:', queue.value.length);
  
  queue.value.forEach((item, index) => {
    console.log(`Queue item ${index}:`, {
      id: item.id,
      jobId: item.jobId,
      name: item.name,
      status: item.status,
      progress: item.progress
    });
  });
}

// Attach to window for easy console access
window.debugVideoStore = debugVideoStore;
window.debugQueue = debugQueue;