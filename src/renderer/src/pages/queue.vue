<template>
  <div class="h-full flex flex-col dark:bg-zinc-900 bg-zinc-50">
    <!-- Header -->
    <header class="flex-shrink-0 border-b dark:border-white/10 border-zinc-200 dark:bg-zinc-900/50 bg-white/50 backdrop-blur-xl">
      <div class="flex items-center justify-between px-6 py-4">
        <div>
          <h1 class="text-xl font-semibold">Encoding Queue</h1>
          <p class="text-sm dark:text-current/60 text-current/70 mt-0.5">
            {{ stats.active }} active, {{ stats.pending }} pending, {{ stats.completed }} completed
          </p>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-3">
          <!-- Clear completed button -->
          <button
            v-if="completedJobs.length > 0"
            @click="handleClearCompleted"
            class="px-3 py-1.5 text-sm dark:text-current/60 hover:dark:text-current text-current/70 hover:text-current transition-colors">
            Clear completed
          </button>
          
          <!-- Pause/Resume button -->
          <button
            v-if="activeJobs.length > 0 || queuedJobs.length > 0"
            @click="toggleQueuePause"
            class="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-smooth transition-colors"
            :class="queueStatus.isPaused 
              ? 'dark:bg-amber-500/20 dark:text-amber-400 bg-amber-100 text-amber-700 dark:hover:bg-amber-500/30 hover:bg-amber-200' 
              : 'dark:bg-white/10 dark:hover:bg-white/15 bg-zinc-100 hover:bg-zinc-200'">
            <Icon :name="queueStatus.isPaused ? 'play' : 'pause'" class="size-4" />
            {{ queueStatus.isPaused ? 'Resume' : 'Pause' }} Queue
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <!-- Empty state -->
      <div v-if="allJobs.length === 0" 
        class="flex flex-col items-center justify-center h-full px-6 py-12">
        <div class="size-16 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center mb-4">
          <Icon name="list" class="size-8 dark:text-current/30 text-current/40" />
        </div>
        <h2 class="text-lg font-medium mb-2">No encoding jobs</h2>
        <p class="text-sm dark:text-current/60 text-current/70 text-center max-w-sm">
          Videos you encode will appear here. Drop files or use the upload page to get started.
        </p>
      </div>

      <!-- Job groups -->
      <div v-else class="py-4">
        <!-- Active/Processing -->
        <div v-if="activeJobs.length > 0" class="mb-6">
          <h2 class="px-6 text-xs font-medium dark:text-current/50 text-current/60 uppercase tracking-wider mb-2">
            Processing
          </h2>
          <div class="dark:bg-zinc-900/50 bg-white border-y dark:border-white/5 border-zinc-200">
            <QueueItem
              v-for="job in activeJobs"
              :key="job.id"
              :job="job"
              @cancel="handleCancel"
              @remove="handleRemove"
            />
          </div>
        </div>

        <!-- Queued -->
        <div v-if="queuedJobs.length > 0" class="mb-6">
          <h2 class="px-6 text-xs font-medium dark:text-current/50 text-current/60 uppercase tracking-wider mb-2">
            Queued
          </h2>
          <div class="dark:bg-zinc-900/50 bg-white border-y dark:border-white/5 border-zinc-200">
            <QueueItem
              v-for="(job, index) in queuedJobs"
              :key="job.id"
              :job="job"
              :queue-position="index + 1"
              @cancel="handleCancel"
              @remove="handleRemove"
            />
          </div>
        </div>

        <!-- Failed -->
        <div v-if="failedJobs.length > 0" class="mb-6">
          <h2 class="px-6 text-xs font-medium dark:text-current/50 text-current/60 uppercase tracking-wider mb-2">
            Failed
          </h2>
          <div class="dark:bg-zinc-900/50 bg-white border-y dark:border-white/5 border-zinc-200">
            <QueueItem
              v-for="job in failedJobs"
              :key="job.id"
              :job="job"
              @remove="handleRemove"
            />
          </div>
        </div>

        <!-- Completed -->
        <div v-if="completedJobs.length > 0" class="mb-6">
          <h2 class="px-6 text-xs font-medium dark:text-current/50 text-current/60 uppercase tracking-wider mb-2">
            Completed
          </h2>
          <div class="dark:bg-zinc-900/50 bg-white border-y dark:border-white/5 border-zinc-200">
            <QueueItem
              v-for="job in completedJobs"
              :key="job.id"
              :job="job"
              @remove="handleRemove"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer stats -->
    <footer v-if="allJobs.length > 0" 
      class="flex-shrink-0 border-t dark:border-white/10 border-zinc-200 px-6 py-3">
      <div class="flex items-center justify-between text-xs dark:text-current/60 text-current/70">
        <div>
          Total: {{ allJobs.length }} {{ allJobs.length === 1 ? 'job' : 'jobs' }}
        </div>
        <div v-if="totalProgress > 0 && totalProgress < 100" class="flex items-center gap-3">
          <span>Overall progress</span>
          <div class="w-32 h-1 bg-current/10 rounded-full overflow-hidden">
            <div 
              class="h-full bg-blue-500 transition-all duration-500"
              :style="{ width: `${totalProgress}%` }"
            />
          </div>
          <span>{{ Math.round(totalProgress) }}%</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useVideoEncodingStore } from '@/stores/videoEncoding'
import QueueItem from '@/components/queue/QueueItem.vue'
import Icon from '@/components/base/Icon.vue'

const videoStore = useVideoEncodingStore()

// Computed properties for different job states
const allJobs = computed(() => videoStore.allJobs)
const activeJobs = computed(() => videoStore.activeJobs)
const completedJobs = computed(() => videoStore.completedJobs)
const failedJobs = computed(() => videoStore.failedJobs)
const queuedJobs = computed(() => 
  allJobs.value.filter(job => job.status === 'queued')
)

const queueStatus = computed(() => videoStore.queueStatus)
const totalProgress = computed(() => videoStore.totalProgress)

// Stats for header
const stats = computed(() => ({
  active: activeJobs.value.length,
  pending: queuedJobs.value.length,
  completed: completedJobs.value.length,
  failed: failedJobs.value.length
}))

// Actions
async function handleCancel(jobId) {
  try {
    await videoStore.cancelJob(jobId)
  } catch (error) {
    console.error('Failed to cancel job:', error)
  }
}

function handleRemove(jobId) {
  videoStore.removeJob(jobId)
}

function handleClearCompleted() {
  videoStore.clearCompleted()
}

async function toggleQueuePause() {
  try {
    if (queueStatus.value.isPaused) {
      await videoStore.resumeQueue()
    } else {
      await videoStore.pauseQueue()
    }
  } catch (error) {
    console.error('Failed to toggle queue pause:', error)
  }
}
</script>