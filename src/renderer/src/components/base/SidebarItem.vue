<template>
  <div :class="[
    'group flex items-center gap-2 px-2.5 py-1.5 rounded-smooth-lg transition-all duration-150',
    highlighted
      ? 'bg-zinc-600/20 text-zinc-50'
      : 'hover:bg-zinc-600/10',
    isDragging ? 'opacity-50' : ''
  ]" :draggable="props.draggable" @click="handleClick" @contextmenu.prevent="handleContextMenu"
    @dragstart="handleDragStart" @dragend="handleDragEnd" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop"
    @dragleave="handleDragLeave">
    <!-- Icon -->
    <Icon v-if="iconName" :name="iconName" :class="[
      'size-[13px] flex-shrink-0',
      iconClass,
      highlighted ? '' : 'text-zinc-400'
    ]" />

    <!-- Content -->
    <div class="flex-1 min-w-0 flex items-center justify-between">
      <!-- Name -->
      <span :contenteditable="isEditing && props.editable" @blur="handleNameBlur"
        @keydown.enter.prevent="handleNameBlur" @keydown.esc="cancelEdit" @click="handleNameClick" ref="nameEditRef"
        :class="[
          'text-[13px] font-regular truncate outline-none',
          highlighted ? 'text-current' : 'group-hover:text-current',
          isEditing && props.editable ? 'bg-zinc-800 rounded' : ''
        ]">{{ editingName }}</span>

      <!-- Right side content slot -->
      <slot name="right" />
    </div>

    <!-- Default slot for any additional content -->
    <slot />
  </div>
</template>

<script setup>
// defineProps and defineEmits are compiler macros and don't need to be imported
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  iconName: {
    type: String,
    default: null
  },
  iconClass: {
    type: String,
    default: ''
  },
  highlighted: {
    type: Boolean,
    default: false
  },
  editingItemId: {
    type: String,
    default: null
  },
  itemId: {
    type: String,
    default: null
  },
  enableContextMenu: {
    type: Boolean,
    default: false
  },
  editable: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'context-menu', 'rename', 'set-editing-item', 'drag-start', 'drag-end', 'drag-over', 'drop', 'drag-leave'])

const editingName = ref(props.name)
const nameEditRef = ref(null)
const isDragging = ref(false)
const isDragOver = ref(false)

// Remove this - we don't want to highlight items on drag over

// Compute if this item is being edited
const isEditing = computed(() => props.editable && props.editingItemId === props.itemId)

// Watch for prop changes and update editingName
watch(() => props.name, (newName) => {
  if (!isEditing.value) {
    editingName.value = newName
  }
})

// Function to focus and select text
const focusAndSelectAll = async () => {
  editingName.value = props.name
  await nextTick()
  
  if (nameEditRef.value) {
    // Set the text content directly
    nameEditRef.value.textContent = props.name
    
    // Focus and select all
    setTimeout(() => {
      if (nameEditRef.value) {
        nameEditRef.value.focus()
        // Use execCommand for better cross-browser support
        document.execCommand('selectAll', false, null)
      }
    }, 0)
  }
}

// Watch for when this item becomes editable
watch(isEditing, async (newValue, oldValue) => {
  if (newValue && !oldValue) {
    await focusAndSelectAll()
  }
})

// Also check on mount in case item is created in editing state
onMounted(async () => {
  if (isEditing.value) {
    await focusAndSelectAll()
  }
})

const handleClick = () => {
  if (!isEditing.value) {
    emit('click')
  }
}

const handleContextMenu = (e) => {
  if (props.enableContextMenu) {
    emit('context-menu', e)
  }
}

const handleNameClick = (e) => {
  if (isEditing.value) {
    e.stopPropagation()
  }
}

const handleNameBlur = () => {
  if (!props.editable || !isEditing.value) return

  const newName = nameEditRef.value.textContent.trim()
  if (newName && newName !== props.name) {
    emit('rename', {
      itemId: props.itemId,
      oldName: props.name,
      newName: newName
    })
    editingName.value = newName
  } else {
    // Revert to original name if empty or unchanged
    nameEditRef.value.textContent = props.name
    editingName.value = props.name
  }

  emit('set-editing-item', null)
}

const cancelEdit = () => {
  if (!props.editable) return

  if (nameEditRef.value) {
    nameEditRef.value.textContent = props.name
  }
  editingName.value = props.name
  emit('set-editing-item', null)
}

// Drag and drop handlers
const handleDragStart = (e) => {
  if (!props.draggable) return

  isDragging.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', JSON.stringify({
    itemId: props.itemId,
    name: props.name
  }))

  emit('drag-start', { event: e, itemId: props.itemId })
}

const handleDragEnd = (e) => {
  isDragging.value = false
  isDragOver.value = false
  emit('drag-end', { event: e, itemId: props.itemId })
}

const handleDragOver = (e) => {
  if (!props.draggable) return

  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
  emit('drag-over', { event: e, itemId: props.itemId })
}

const handleDrop = (e) => {
  if (!props.draggable) return

  e.preventDefault()
  isDragOver.value = false

  const data = e.dataTransfer.getData('text/plain')
  if (data) {
    try {
      const draggedItem = JSON.parse(data)
      emit('drop', { event: e, draggedItemId: draggedItem.itemId, targetItemId: props.itemId })
    } catch (err) {
      console.error('Invalid drag data:', err)
    }
  }
}

const handleDragLeave = (e) => {
  // Only clear if leaving the element entirely
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isDragOver.value = false
    emit('drag-leave', { event: e, itemId: props.itemId })
  }
}
</script>