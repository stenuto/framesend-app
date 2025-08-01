<template>
<div class="group relative rounded-smooth-md overflow-hidden shadow-xs"
  :class="{
    'ring-1 ring-white/5': !isDragOver && !isSelected,
    'ring-2 ring-blue-500': (isDragOver && item.type === 'folder') || isSelected
  }"
  :draggable="!isEditing"
  @dragstart="!isEditing ? $emit('drag-start', $event, item) : null"
  @dragend="$emit('drag-end', $event)"
  @drop="item.type === 'folder' ? $emit('drop', $event, item.id) : null"
  @dragover.prevent="item.type === 'folder' ? $emit('drag-over', $event, item.id) : null"
  @dragleave="item.type === 'folder' ? $emit('drag-leave', $event, item.id) : null"
  @click="handleClick"
  @dblclick="handleDoubleClick"
  @contextmenu.prevent="$emit('context-menu', $event, item)">

  <div class="flex flex-col"
    :class="containerClasses">

    <!-- Preview Area -->
    <div class="aspect-video bg-zinc-900 relative overflow-hidden">
      <!-- Folder Preview -->
      <FolderThumbnailPreview v-if="item.type === 'folder'"
        :items="folderVideos" />

      <!-- Video Thumbnail -->
      <template v-else-if="item.type === 'video'">
        <img v-if="thumbnail"
          :src="thumbnail"
          :alt="`${item.name} thumbnail`"
          class="w-full h-full object-cover" />
        <PlaceholderImage v-else
          :seed="item.id"
          :alt="`${item.name} thumbnail`" />

        <!-- Status Overlays -->
        <div v-if="item.status === 'processing'"
          class="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div class="flex flex-col items-center">
            <svg class="size-5 -rotate-90" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                class="text-white/20" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                :stroke-dasharray="`${2 * Math.PI * 10}`"
                :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (item.progress || 0) / 100)}`"
                class="text-blue-500" />
            </svg>
            <span class="text-white text-sm mt-2">{{ Math.round(item.progress || 0) }}%</span>
          </div>
        </div>

        <div v-else-if="item.status === 'queued'"
          class="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span class="text-white text-sm">Queued</span>
        </div>

        <div v-else-if="item.status === 'failed'"
          class="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span class="text-red-400 text-sm">Failed</span>
        </div>

      </template>
    </div>

    <!-- Info Section -->
    <div class="p-2">
      <div class="flex items-center gap-1.5" :class="{ 'opacity-50': item.status === 'processing' || item.status === 'queued' }">
        <!-- Encoding status icons -->
        <Icon v-if="!isEditing && item.type === 'video' && item.status === 'queued'" name="clock-fading" class="size-[13px] flex-shrink-0 text-blue-600" :stroke-width="2" />
        <svg v-else-if="!isEditing && item.type === 'video' && item.status === 'processing'" class="size-[13px] flex-shrink-0 -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" class="text-blue-600/20" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" :stroke-dasharray="`${2 * Math.PI * 10}`" :stroke-dashoffset="`${2 * Math.PI * 10 * (1 - (item.progress || 0) / 100)}`" class="text-blue-600 transition-all duration-500" />
        </svg>
        <Icon v-else-if="!isEditing && item.type === 'video'" :name="itemIcon" class="size-[13px] flex-shrink-0" :class="iconColor" :stroke-width="2" />

        <h4 v-if="!isEditing" class="text-[13px] font-medium truncate">
          {{ item.name }}
        </h4>

        <input v-else ref="editInput" :value="item.name" @blur="handleRename" @keydown.enter="handleRename" @keydown.esc="$emit('cancel-edit')" :data-item-id="item.id" class="text-sm font-medium w-full bg-zinc-700 rounded outline-none focus:ring-2 focus:ring-blue-500 px-1" />
      </div>

      <div class="flex items-center justify-between mt-1 text-[11px]">
        <span class="text-zinc-500">{{ primaryMetadata }}</span>
        <span class="text-zinc-500">{{ secondaryMetadata }}</span>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { computed, watch, nextTick, ref } from 'vue'
import Icon from '@/components/base/Icon.vue'
import FolderThumbnailPreview from '@/components/FolderThumbnailPreview.vue'
import PlaceholderImage from '@/components/PlaceholderImage.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  isDragOver: {
    type: Boolean,
    default: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  folderVideos: {
    type: Array,
    default: () => []
  },
  folderVideoCount: {
    type: Number,
    default: 0
  },
  folderSize: {
    type: String,
    default: '-'
  },
  thumbnail: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'click',
  'double-click',
  'drag-start',
  'drag-end',
  'drag-over',
  'drag-leave',
  'drop',
  'context-menu',
  'rename',
  'cancel-edit'
])

// Template refs
const editInput = ref(null)


// Computed properties
const containerClasses = computed(() => ({
  'bg-zinc-800 hover:bg-zinc-700/50': true,
  'cursor-pointer': props.item.type === 'video' || props.item.type === 'folder'
}))

const itemIcon = computed(() => {
  return props.item.type === 'folder' ? 'folder' : 'video'
})

const iconColor = computed(() => {
  return props.item.type === 'folder' ? 'text-zinc-500' : 'text-blue-600'
})

const primaryMetadata = computed(() => {
  if (props.item.type === 'folder') {
    return props.folderSize
  } else {
    return props.item.duration || '0:00'
  }
})

const secondaryMetadata = computed(() => {
  if (props.item.type === 'folder') {
    return '' // No secondary metadata for folders
  } else {
    return props.item.size || ''
  }
})


// Methods
const handleClick = () => {
  // Emit click for both folders and videos - parent will handle selection
  emit('click', props.item)
}

const handleDoubleClick = () => {
  if (props.item.type === 'folder') {
    emit('double-click', props.item)
  }
}

const handleRename = (event) => {
  const newName = event.target.value.trim()
  if (newName && newName !== props.item.name) {
    emit('rename', {
      itemId: props.item.id,
      oldName: props.item.name,
      newName: newName,
      itemType: props.item.type
    })
  } else {
    emit('cancel-edit')
  }
}

// Watch for editing state to focus input
watch(() => props.isEditing, async (isEditing) => {
  if (isEditing) {
    await nextTick()
    if (editInput.value) {
      editInput.value.focus()
      editInput.value.select()
    }
  }
})
</script>