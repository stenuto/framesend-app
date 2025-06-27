<template>
  <div class="flex w-80 shrink-0 flex-col rounded-lg bg-gray-100" @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave" @drop="handleDrop">
    <!-- Column Header -->
    <div class="flex items-center justify-between p-3">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-gray-700">{{ list.name }}</h3>
        <Badge variant="secondary" class="text-xs">
          {{ videos.length }}
        </Badge>
      </div>
      <Button variant="ghost" size="sm">
        <Icon name="plus" size="sm" />
      </Button>
    </div>

    <!-- Video Cards -->
    <div class="video-cards-container relative flex-1 overflow-y-auto py-3 pl-3.5">
      <TransitionGroup name="cards" tag="div" class="space-y-3">
        <!-- Drop placeholder at the beginning -->
        <Transition name="placeholder">
          <div v-if="isDraggingOver && dragOverIndex === 0" :key="`placeholder-0`" class="placeholder-wrapper">
            <div :style="{ height: `${draggedCardHeight}px` }"
              class="placeholder rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-center">
              <span class="text-sm text-blue-600 font-medium placeholder-text">Drop here</span>
            </div>
          </div>
        </Transition>

        <template v-for="(video, index) in videos" :key="video.id">
          <VideoCard :video="video" :list-id="list.id" :index="index" @dragover="handleDragOverCard($event, index)" />

          <!-- Drop placeholder after each card -->
          <Transition name="placeholder">
            <div v-if="isDraggingOver && dragOverIndex === index + 1" :key="`placeholder-${index + 1}`"
              class="placeholder-wrapper">
              <div :style="{ height: `${draggedCardHeight}px` }"
                class="placeholder rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 flex items-center justify-center">
                <span class="text-sm text-blue-600 font-medium placeholder-text">Drop here</span>
              </div>
            </div>
          </Transition>
        </template>
      </TransitionGroup>
    </div>

    <!-- Add Card Button -->
    <div class="p-3 pt-0">
      <Button variant="ghost" class="w-full justify-start" size="sm">
        <Icon name="plus" size="sm" class="mr-2" />
        Add a video
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useVideosStore } from '../../stores/videos'
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import VideoCard from './VideoCard.vue'
import Badge from '../base/Badge.vue'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'

const props = defineProps({
  list: {
    type: Object,
    required: true
  }
})

const videosStore = useVideosStore()
const uiStore = useUIStore()
const isDraggingOver = ref(false)
const dragOverIndex = ref(null)
const { draggedCardHeight, draggedCard, draggedCardOriginalPosition } = storeToRefs(uiStore)

const videos = computed(() => videosStore.videosByList(props.list.id))

// Handle ESC key to cancel drag
const handleEscKey = (e) => {
  if (e.key === 'Escape' && draggedCard.value) {
    // Restore the card to its original position
    videosStore.restoreVideo(
      draggedCard.value,
      draggedCardOriginalPosition.value.listId,
      draggedCardOriginalPosition.value.index
    )
    uiStore.clearDragging()
    isDraggingOver.value = false
    dragOverIndex.value = null
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

const handleDragOver = (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  isDraggingOver.value = true

  // If not over a specific card, default to end of list
  if (dragOverIndex.value === null) {
    dragOverIndex.value = videos.value.length
  }
}

const handleDragOverCard = (e, index) => {
  e.preventDefault()
  e.stopPropagation()

  const rect = e.currentTarget.getBoundingClientRect()
  const halfHeight = rect.height / 2
  const relativeY = e.clientY - rect.top

  // Determine drop position based on cursor position
  // Top half: insert before this card
  // Bottom half: insert after this card
  if (relativeY < halfHeight) {
    dragOverIndex.value = index
  } else {
    dragOverIndex.value = index + 1
  }
}

const handleDragLeave = (e) => {
  // Only reset if we're leaving the column entirely
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDraggingOver.value = false
    dragOverIndex.value = null
  }
}

const handleDrop = (e) => {
  e.preventDefault()
  isDraggingOver.value = false

  // Use the dragged card from the store
  if (draggedCard.value) {
    const targetIndex = dragOverIndex.value !== null ? dragOverIndex.value : videos.value.length

    // Re-add the card at the new position
    videosStore.restoreVideo(draggedCard.value, props.list.id, targetIndex)
    uiStore.clearDragging()
  }

  dragOverIndex.value = null
}
</script>

<style scoped>
/* Prevent layout shift when scrollbar appears/disappears */
.video-cards-container {
  scrollbar-gutter: stable;
}

/* Card list transitions */
.cards-move,
.cards-enter-active,
.cards-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cards-enter-from {
  opacity: 0;
}

.cards-enter-to {
  opacity: 1;
}

.cards-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.cards-leave-active {
  position: absolute;
  width: 100%;
}

/* Placeholder transitions */
.placeholder-wrapper {
  overflow: hidden;
}

.placeholder-enter-active {
  animation: placeholder-fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.placeholder-leave-active {
  animation: placeholder-fade-out 0.15s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes placeholder-fade-in {
  from {
    opacity: 0;
    max-height: 0;
  }

  to {
    opacity: 1;
    max-height: 300px;
  }
}

@keyframes placeholder-fade-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

.placeholder {
  transform-origin: top center;
  animation: placeholder-scale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.placeholder-text {
  animation: fade-in 0.3s ease-out 0.1s both;
}

@keyframes placeholder-scale {
  from {
    transform: scaleY(0.8);
    opacity: 0.5;
  }

  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
