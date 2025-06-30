<template>
  <div class="file-explorer h-full overflow-y-auto">
    <div v-for="item in items" :key="item.id" @click="handleItemClick(item)">
      <FileExplorerItem :item="item" :depth="0" :expanded-folders="expandedFolders" :selected-item-id="selectedItemId"
        :config="config" @toggle-folder="toggleFolder" @select-video="selectVideo" @select-folder="selectFolder" />
    </div>
  </div>
</template>

<script>
import { useFileExplorerStore } from '../stores/fileExplorer'
import FileExplorerItem from './FileExplorerItem.vue'

export default {
  name: 'FileExplorer',
  components: {
    FileExplorerItem
  },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({
        indentSize: 12, // pixels per depth level
        itemPaddingY: 'py-[3px]', // tailwind class for vertical padding
        itemPaddingX: 'px-1', // tailwind class for horizontal padding
        fontSize: 'text-sm', // tailwind class for font size
        chevronSize: 'size-4', // tailwind class for chevron size
        videoIconSize: 'size-3.5', // tailwind class for video icon size
        guideLineOffset: 15, // pixels from left edge of indentation
        initialFolderOffset: 8, // initial padding for root folders
        videoIndentExtra: 20, // extra indent for video items
        showVideoCount: false,
        showVideoDuration: false
      })
    }
  },
  emits: ['select-video', 'select-folder'],

  setup() {
    const fileExplorerStore = useFileExplorerStore()
    return {
      fileExplorerStore
    }
  },
  computed: {
    expandedFolders() {
      return this.fileExplorerStore.expandedFolders
    },
    selectedItemId() {
      return this.fileExplorerStore.selectedItemId
    }
  },
  methods: {
    toggleFolder(folderId) {
      this.fileExplorerStore.toggleFolder(folderId)
    },
    selectVideo(video) {
      this.fileExplorerStore.setSelectedItem(video.id)
      this.$emit('select-video', video)
    },
    selectFolder(folder) {
      this.fileExplorerStore.setSelectedItem(folder.id)
      this.$emit('select-folder', folder)
    },
    handleItemClick(item) {
      if (item.type === 'folder') {
        this.toggleFolder(item.id)
        this.selectFolder(item)
      } else {
        this.selectVideo(item)
      }
    }
  }
}
</script>