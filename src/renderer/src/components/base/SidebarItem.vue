<template>
  <div :class="[
    'group flex items-center gap-2 px-2.5 py-1.5 rounded-smooth-lg cursor-pointer',
    highlighted
      ? 'dark:bg-zinc-600/20 bg-zinc-500/20 dark:text-zinc-50 text-zinc-800'
      : 'hover:dark:bg-zinc-600/10 hover:bg-zinc-500/10'
  ]" @click="handleClick" @contextmenu.prevent="handleContextMenu">
    <!-- Icon -->
    <Icon v-if="iconName" :name="iconName" :class="[
      'size-[13px] flex-shrink-0',
      iconClass,
      highlighted ? '' : 'text-zinc-500 dark:text-zinc-400'
    ]" />

    <!-- Content -->
    <div class="flex-1 min-w-0 flex items-center justify-between">
      <!-- Name -->
      <span :contenteditable="isEditing && props.editable" @blur="handleNameBlur" @keydown.enter.prevent="handleNameBlur"
        @keydown.esc="cancelEdit" @click="handleNameClick" ref="nameEditRef" :class="[
          'text-[13px] font-regular truncate outline-none',
          highlighted ? 'text-current' : 'group-hover:text-current',
          isEditing && props.editable ? 'bg-zinc-100 dark:bg-zinc-800 rounded' : ''
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
import { ref, computed, watch, nextTick } from 'vue'
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
  }
})

const emit = defineEmits(['click', 'context-menu', 'rename', 'set-editing-item'])

const editingName = ref(props.name)
const nameEditRef = ref(null)

// Compute if this item is being edited
const isEditing = computed(() => props.editable && props.editingItemId === props.itemId)

// Watch for prop changes and update editingName
watch(() => props.name, (newName) => {
  if (!isEditing.value) {
    editingName.value = newName
  }
})

// Watch for when this item becomes editable
watch(isEditing, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    editingName.value = props.name
    nextTick(() => {
      nextTick(() => {
        if (nameEditRef.value) {
          nameEditRef.value.focus()
          // Small delay before selection to ensure focus is complete
          setTimeout(() => {
            const range = document.createRange()
            range.selectNodeContents(nameEditRef.value)
            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
          }, 10)
        }
      })
    })
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
</script>