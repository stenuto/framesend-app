<template>
  <div
    :class="[
      'group flex items-center gap-1 h-5 rounded cursor-pointer select-none',
      'hover:bg-zinc-800/50 transition-colors',
      isDragging && 'opacity-50'
    ]"
    :style="{ paddingLeft: `${14 + depth * 12}px` }"
    draggable="true"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
    @dragover.prevent="$emit('dragover', $event)"
    @drop.prevent="$emit('drop', $event)"
    @contextmenu.prevent="handleContextMenu"
  >
    <Icon name="film" class="w-3 h-3 text-zinc-500 flex-shrink-0" />
    <div class="flex-1 min-w-0 flex items-baseline gap-1.5">
      <p class="text-[13px] text-zinc-300 truncate">{{ file.name }}</p>
      <p class="text-[11px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
        {{ file.metadata?.duration || '' }}
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onUnmounted } from 'vue'
import Icon from '@components/base/Icon.vue'

export default defineComponent({
  name: 'FileItem',
  components: {
    Icon
  },
  props: {
    file: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    isDragging: {
      type: Boolean,
      default: false
    }
  },
  emits: ['dragstart', 'dragend', 'dragover', 'drop', 'rename', 'delete'],
  setup(props, { emit }) {
    let unsubscribe = null
    
    const handleContextMenu = async (event) => {
      const menuTemplate = [
        {
          label: 'Share',
          submenu: [
            {
              label: 'Copy Web Link',
              action: 'share:copyWebLink',
              data: { fileId: props.file.id, fileName: props.file.name }
            },
            ...(props.file.type === 'video' ? [{
              label: 'Copy iFrame Embed',
              action: 'share:copyIframeEmbed',
              data: { fileId: props.file.id, fileName: props.file.name }
            }] : [])
          ]
        },
        { type: 'separator' },
        {
          label: 'Rename',
          action: 'file:rename',
          data: { fileId: props.file.id, fileName: props.file.name }
        },
        {
          label: 'Delete',
          action: 'file:delete',
          data: { fileId: props.file.id, fileName: props.file.name }
        }
      ]
      
      await window.api.menu.showContext(menuTemplate, {
        x: event.clientX,
        y: event.clientY
      })
    }
    
    const handleMenuAction = (action, data) => {
      switch (action) {
        case 'share:copyWebLink':
          // Copy web link to clipboard
          navigator.clipboard.writeText(`https://app.framesend.com/files/${data.fileId}`)
          break
          
        case 'share:copyIframeEmbed':
          // Copy iframe embed code
          const embedCode = `<iframe src="https://app.framesend.com/embed/${data.fileId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
          navigator.clipboard.writeText(embedCode)
          break
          
        case 'file:rename':
          emit('rename', data)
          break
          
        case 'file:delete':
          emit('delete', data)
          break
      }
    }
    
    onMounted(() => {
      unsubscribe = window.api.menu.onAction(handleMenuAction)
    })
    
    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe()
      }
    })
    
    return {
      handleContextMenu
    }
  }
})
</script>