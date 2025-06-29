<template>
  <div :draggable="true"
    :class="['group cursor-move rounded-smooth-lg bg-white dark:bg-zinc-800 p-2 shadow-xs border border-zinc-200 dark:border-zinc-700 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-600 transform-gpu', { 'opacity-50': isDragging }]"
    @mousedown="handleMouseDown" @mousedown.stop @dragstart="handleDragStart" @dragend="handleDragEnd"
    @dragover="$emit('dragover', $event)">
    <!-- Video Thumbnail -->
    <div class="relative mb-2 overflow-hidden rounded-smooth bg-zinc-100">
      <img :src="video.thumbnail" :alt="video.title" class="aspect-video w-full object-cover" draggable="false" />
      <div
        class="absolute bottom-2 right-2 rounded-smooth-sm bg-black/70 leading-none px-1 py-[3px] text-[10px] text-white">
        {{ video.duration }}
      </div>
      <!-- <div
        class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <Icon name="play" size="lg" class="text-white" />
      </div> -->
    </div>

    <div class="px-1">
      <div class="flex items-start justify-between">
        <div class="shrink-0">
          <!-- Video Title -->
          <h3 class="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1">
            {{ video.title }}
          </h3>
          <!-- Labels -->
          <div v-if="video.labels && video.labels.length > 0" class="mb-2 flex flex-wrap gap-1">
            <Badge v-for="labelId in video.labels" :key="labelId"
              :variant="labelsStore.labelById(labelId) ? 'custom' : 'default'"
              :color="labelsStore.labelById(labelId)?.color || 'zinc'"
              :shade="labelsStore.labelById(labelId)?.shade || 500" class="text-xs">
              {{ labelsStore.labelById(labelId)?.name || 'Unknown' }}
            </Badge>
          </div>
        </div>
        <!-- Assignees -->
        <div class="flex -space-x-2">
          <Avatar v-for="(assignee, index) in video.assignees.slice(0, 3)" :key="assignee.id" :src="assignee.avatar"
            :name="assignee.name" size="xs" class="ring-2 ring-white"
            :style="{ zIndex: video.assignees.length - index }" />
          <div v-if="video.assignees.length > 3"
            class="flex size-8 items-center justify-center rounded-smooth-full bg-zinc-200 text-xs font-medium text-zinc-600 ring-2 ring-white">
            +{{ video.assignees.length - 3 }}
          </div>
        </div>
      </div>




    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVideosStore } from '../../stores/videos'
import { useUIStore } from '../../stores/ui'
import { useLabelsStore } from '../../stores/labels'
import Avatar from '../base/Avatar.vue'
import Badge from '../base/Badge.vue'
import Button from '../base/Button.vue'
import Icon from '../base/Icon.vue'

const props = defineProps({
  video: {
    type: Object,
    required: true
  },
  listId: {
    type: String,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const videosStore = useVideosStore()
const uiStore = useUIStore()
const labelsStore = useLabelsStore()
const isDragging = ref(false)

defineEmits(['dragover'])

const handleMouseDown = (e) => {
  // Mouse down handler for debugging - can be removed if not needed
}

const handleDragStart = (e) => {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('videoId', props.video.id)

  // Store the actual height of the card being dragged
  const cardHeight = e.target.offsetHeight
  uiStore.setDraggedCardHeight(cardHeight)

  // Store the card data and remove it from the list
  uiStore.startDragging(props.video, props.listId, props.video.order)

  // Delay removing the video to ensure the drag is properly initiated
  setTimeout(() => {
    videosStore.temporarilyRemoveVideo(props.video.id)
  }, 0)

  isDragging.value = true
}

const handleDragEnd = () => {
  isDragging.value = false

  // If the card is still in the dragged state, it means the drop was cancelled
  // (dropped outside a valid zone)
  if (uiStore.draggedCard) {
    videosStore.restoreVideo(
      uiStore.draggedCard,
      uiStore.draggedCardOriginalPosition.listId,
      uiStore.draggedCardOriginalPosition.index
    )
    uiStore.clearDragging()
  }
}
</script>
