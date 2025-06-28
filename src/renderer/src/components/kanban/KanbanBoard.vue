<template>
  <div class="kanban-board h-full overflow-x-auto" @dragover.prevent="handleBoardDragOver" @drop="handleBoardDrop">
    <TransitionGroup name="lists" tag="div" class="flex gap-4 min-h-full p-6">
      <!-- Drop placeholder at the beginning -->
      <div v-if="isDraggingOverBoard && dragOverListIndex === 0" :key="`list-placeholder-0`"
        class="list-placeholder-wrapper flex-col" :style="{ width: `${draggedListWidth}px`, height: `${draggedListHeight}px` }">
        <div class="list-placeholder rounded-smooth-xl bg-gray-200/70 flex items-center justify-center flex-1">
          <span class="text-sm text-gray-700 font-medium placeholder-text">Drop here</span>
        </div>
      </div>

      <template v-for="(list, index) in lists" :key="list.id">
        <KanbanColumn :list="list" :index="index" :project-id="activeProjectId"
          @dragover-list="handleDragOverList($event, index)" />

        <!-- Drop placeholder after each list -->
        <div v-if="isDraggingOverBoard && dragOverListIndex === index + 1" :key="`list-placeholder-${index + 1}`"
          class="list-placeholder-wrapper flex-col" :style="{ width: `${draggedListWidth}px`, height: `${draggedListHeight}px` }">
          <div class="list-placeholder rounded-smooth-xl bg-gray-200/70 flex items-center justify-center flex-1">
            <span class="text-sm text-gray-700 font-medium placeholder-text">Drop here</span>
          </div>
        </div>
      </template>

      <!-- Add List Button -->
      <div key="add-list-button" class="flex w-80 shrink-0 items-start">
        <Button variant="ghost" class="w-full justify-start">
          <Icon name="plus" size="sm" class="mr-2" />
          Add another list
        </Button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProjectsStore } from '../../stores/projects'
import { useVideosStore } from '../../stores/videos'
import { useUIStore } from '../../stores/ui'
import { storeToRefs } from 'pinia'
import KanbanColumn from './KanbanColumn.vue'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'

const projectsStore = useProjectsStore()
const videosStore = useVideosStore()
const uiStore = useUIStore()

const { activeProjectId } = storeToRefs(projectsStore)
const { draggedListWidth, draggedListHeight, draggedList, draggedListOriginalPosition } = storeToRefs(uiStore)

const lists = computed(() => videosStore.listsByProject(activeProjectId.value))
const isDraggingOverBoard = ref(false)
const dragOverListIndex = ref(null)

// Handle ESC key to cancel drag
const handleEscKey = (e) => {
  if (e.key === 'Escape' && draggedList.value) {
    // Restore the list to its original position
    videosStore.restoreList(
      draggedList.value,
      draggedListOriginalPosition.value.projectId,
      draggedListOriginalPosition.value.index
    )
    uiStore.clearListDragging()
    isDraggingOverBoard.value = false
    dragOverListIndex.value = null
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey)
})

const handleBoardDragOver = (e) => {
  // Only handle if we're dragging a list
  if (!draggedList.value) return

  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  isDraggingOverBoard.value = true

  // If not over a specific list, default to end
  if (dragOverListIndex.value === null) {
    dragOverListIndex.value = lists.value.length
  }
}

const handleDragOverList = (e, index) => {
  if (!draggedList.value) return

  e.preventDefault()
  e.stopPropagation()

  const rect = e.currentTarget.getBoundingClientRect()
  const halfWidth = rect.width / 2
  const relativeX = e.clientX - rect.left

  // Determine drop position based on cursor position
  // Left half: insert before this list
  // Right half: insert after this list
  if (relativeX < halfWidth) {
    dragOverListIndex.value = index
  } else {
    dragOverListIndex.value = index + 1
  }
}

const handleBoardDrop = (e) => {
  if (!draggedList.value) return

  e.preventDefault()

  // Capture the target index and dragged list before clearing
  const targetIndex = dragOverListIndex.value !== null ? dragOverListIndex.value : lists.value.length
  const listToRestore = draggedList.value
  const projectId = activeProjectId.value

  // Immediately hide the placeholder
  isDraggingOverBoard.value = false
  dragOverListIndex.value = null

  // Use the captured values
  if (listToRestore) {
    videosStore.restoreList(listToRestore, projectId, targetIndex)
    uiStore.clearListDragging()
  }
}
</script>

<style scoped>
/* Ensure proper scrolling */
.kanban-board {
  box-sizing: border-box;
}

/* List transitions */
.lists-move,
.lists-enter-active,
.lists-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.lists-enter-from {
  opacity: 0;
}

.lists-enter-to {
  opacity: 1;
}

.lists-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.lists-leave-active {
  position: absolute;
  height: 100%;
}

/* Placeholder transitions */
.list-placeholder-wrapper {
  overflow: hidden;
  display: flex;
  flex-shrink: 0;
}

.list-placeholder-enter-active {
  animation: list-placeholder-grow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-placeholder-leave-active {
  animation: list-placeholder-fade-only 0.3s cubic-bezier(0.4, 0, 1, 1) both;
}

@keyframes list-placeholder-grow {
  from {
    opacity: 0;
    max-width: 0;
  }

  to {
    opacity: 1;
    max-width: 320px;
  }
}

@keyframes list-placeholder-fade-only {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

.list-placeholder {
  transform-origin: left center;
  animation: list-placeholder-scale 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.placeholder-text {
  animation: fade-in 0.3s ease-out 0.1s both;
}

@keyframes list-placeholder-scale {
  from {
    transform: scaleX(0.8);
    opacity: 0.5;
  }

  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>