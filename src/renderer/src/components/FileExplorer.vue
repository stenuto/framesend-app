<template>
  <div class="file-explorer h-full overflow-y-auto">
    <div 
      v-for="item in items" 
      :key="item.id"
      @click="handleItemClick(item)"
    >
      <FileExplorerItem 
        :item="item" 
        :depth="0"
        :expanded-folders="expandedFolders"
        :selected-item-id="selectedItemId"
        @toggle-folder="toggleFolder"
        @select-video="selectVideo"
        @select-folder="selectFolder"
      />
    </div>
  </div>
</template>

<script>
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
    }
  },
  data() {
    return {
      expandedFolders: new Set(['proj1', 'proj2']), // Start with some folders expanded
      selectedItemId: null
    }
  },
  methods: {
    toggleFolder(folderId) {
      if (this.expandedFolders.has(folderId)) {
        this.expandedFolders.delete(folderId)
      } else {
        this.expandedFolders.add(folderId)
      }
    },
    selectVideo(video) {
      this.selectedItemId = video.id
      this.$emit('select-video', video)
    },
    selectFolder(folder) {
      this.selectedItemId = folder.id
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