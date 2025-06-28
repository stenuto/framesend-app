<template>
  <div class="list-container">
    <!-- Invisible drag handle that covers the entire list -->
    <div v-if="showDragHandle" 
      :draggable="true"
      @dragstart="handleListDragStart" 
      @dragend="handleListDragEnd"
      class="absolute inset-0 z-10"></div>
    
    <!-- Actual column content -->
    <div ref="columnRef"
      :class="['kanban-column flex w-80 shrink-0 flex-col rounded-smooth-xl bg-gray-100 border border-gray-200 transition-all duration-300 relative', { 'opacity-50': isDraggingList }]"
      @dragover.prevent="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
      <!-- Column Header -->
      <div class="flex items-center justify-between px-3.5 pb-0 pt-2 cursor-move"
        @mousedown="handleHeaderMouseDown" 
        @mouseup="handleHeaderMouseUp">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-gray-700">{{ list.name }}</h3>
          <Badge class="text-xs">
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
        <div v-if="isDraggingOver && dragOverIndex === 0" :key="`placeholder-0`" class="placeholder-wrapper"
          :style="{ height: `${draggedCardHeight}px` }">
          <div class="placeholder rounded-smooth-lg bg-gray-200/70 flex items-center justify-center h-full">
            <span class="text-sm text-gray-700 font-medium placeholder-text">Drop here</span>
          </div>
        </div>

        <template v-for="(video, index) in videos" :key="video.id">
          <VideoCard :video="video" :list-id="list.id" :index="index" @dragover="handleDragOverCard($event, index)" />

          <!-- Drop placeholder after each card -->
          <div v-if="isDraggingOver && dragOverIndex === index + 1" :key="`placeholder-${index + 1}`"
            class="placeholder-wrapper" :style="{ height: `${draggedCardHeight}px` }">
            <div class="placeholder rounded-smooth-lg bg-gray-200/70 flex items-center justify-center h-full">
              <span class="text-sm text-gray-700 font-medium placeholder-text">Drop here</span>
            </div>
          </div>
        </template>
      </TransitionGroup>
    </div>

    <!-- Add Card Button -->
    <!-- <div class="p-3 pt-0">
      <Button variant="ghost" class="w-full justify-start" size="sm">
        <Icon name="plus" size="sm" class="mr-2" />
        Add a video
      </Button>
    </div> -->
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
  },
  index: {
    type: Number,
    required: true
  },
  projectId: {
    type: String,
    required: true
  }
})

const videosStore = useVideosStore()
const uiStore = useUIStore()
const isDraggingOver = ref(false)
const dragOverIndex = ref(null)
const isDraggingList = ref(false)
const columnRef = ref(null)
const showDragHandle = ref(false)
const { draggedCardHeight, draggedCard, draggedCardOriginalPosition, draggedList } = storeToRefs(uiStore)

const videos = computed(() => videosStore.videosByList(props.list.id))

const emit = defineEmits(['dragover-list'])

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

const handleHeaderMouseDown = () => {
  showDragHandle.value = true
}

const handleHeaderMouseUp = () => {
  setTimeout(() => {
    showDragHandle.value = false
  }, 100)
}

const handleListDragStart = (e) => {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('listId', props.list.id)

  // Store the actual width and height of the list being dragged
  const listWidth = columnRef.value ? columnRef.value.offsetWidth : 320
  const listHeight = columnRef.value ? columnRef.value.offsetHeight : 600
  uiStore.setDraggedListWidth(listWidth)
  uiStore.setDraggedListHeight(listHeight)

  // Store the list data and remove it from the lists
  uiStore.startDraggingList(props.list, props.projectId, props.list.order)
  videosStore.temporarilyRemoveList(props.list.id)

  isDraggingList.value = true
}

const handleListDragEnd = () => {
  isDraggingList.value = false
  showDragHandle.value = false

  // If the list is still in the dragged state, it means the drop was cancelled
  // (dropped outside a valid zone)
  if (uiStore.draggedList) {
    videosStore.restoreList(
      uiStore.draggedList,
      uiStore.draggedListOriginalPosition.projectId,
      uiStore.draggedListOriginalPosition.index
    )
    uiStore.clearListDragging()
  }
}

const handleDragOver = (e) => {
  // Don't handle dragover if we're dragging a list
  if (draggedList.value) {
    e.stopPropagation()
    emit('dragover-list', e, props.index)
    return
  }

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

  // If we're handling a list drop, let the parent handle it
  if (draggedList.value) {
    return
  }

  // Capture the target index and dragged card before clearing
  const targetIndex = dragOverIndex.value !== null ? dragOverIndex.value : videos.value.length
  const cardToRestore = draggedCard.value
  const listId = props.list.id

  // Immediately hide the placeholder
  isDraggingOver.value = false
  dragOverIndex.value = null

  // Use the captured values
  if (cardToRestore) {
    videosStore.restoreVideo(cardToRestore, listId, targetIndex)
    uiStore.clearDragging()
  }
}
</script>

<style scoped>
/* List container */
.list-container {
  position: relative;
  display: flex;
  flex-shrink: 0;
}

/* Column styling */
.kanban-column {
  height: 100%;
}

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
  display: block;
}

.placeholder-enter-active {
  animation: placeholder-grow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.placeholder-leave-active {
  animation: placeholder-fade-only 0.3s cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes placeholder-grow {
  from {
    opacity: 0;
    max-height: 0;
  }

  to {
    opacity: 1;
    max-height: 300px;
  }
}

@keyframes placeholder-fade-only {
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
