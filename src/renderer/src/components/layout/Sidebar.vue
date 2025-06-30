<template>
  <div
    class="flex h-full w-70 flex-col shrink-0 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700">
    <!-- Header -->
    <div class="flex h-12 items-center px-4 border-b border-zinc-200 dark:border-zinc-700">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Explorer</h2>
    </div>

    <!-- Search -->
    <div class="p-2 border-b border-zinc-200 dark:border-zinc-700">
      <div class="relative">
        <Icon name="search"
          class="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 dark:text-zinc-500" />
        <input v-model="searchQuery" placeholder="Search files..."
          class="w-full h-7 pl-7 pr-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          @input="handleSearch" />
      </div>
    </div>

    <!-- File Explorer -->
    <div class="flex-1 overflow-y-auto my-1.5">
      <FileExplorer :items="filteredFileTree" @select-video="handleVideoSelect" />
    </div>
  </div>
</template>

<script>
import { useFileExplorerStore } from '../../stores/fileExplorer'
import { useUIStore } from '../../stores/ui'
import Icon from '../base/Icon.vue'
import FileExplorer from '../FileExplorer.vue'

export default {
  name: 'Sidebar',
  components: {
    Icon,
    FileExplorer
  },
  emits: ['select-video'],
  data() {
    return {
      searchQuery: ''
    }
  },
  computed: {
    fileTree() {
      const fileExplorerStore = useFileExplorerStore()

      // Build folder hierarchy with unified ordering
      const buildTree = (parentId = null) => {
        // Get all items (folders and files) at this level, sorted by itemOrder
        const items = fileExplorerStore.getItemsByParent(parentId)
        
        return items.map(item => {
          if (item.type === 'folder') {
            // For folders, recursively build children
            const folderFiles = fileExplorerStore.getFilesByFolder(item.id)
            const children = buildTree(item.id)
            
            return {
              id: item.id,
              name: item.name,
              type: 'folder',
              videoCount: folderFiles.length,
              parentId: item.parentId,
              orderIndex: item.orderIndex,
              itemOrder: item.itemOrder,
              children: children
            }
          } else {
            // For files/videos, return as-is with additional properties
            return {
              id: item.id,
              name: item.name,
              type: 'video',
              duration: item.metadata?.duration,
              folderId: item.folderId,
              orderIndex: item.orderIndex,
              itemOrder: item.itemOrder,
              ...item
            }
          }
        })
      }

      // Build tree starting from root (null parent)
      return buildTree(null)
    },
    filteredFileTree() {
      if (!this.searchQuery) return this.fileTree

      // Filter the tree based on search query
      return this.filterTree(this.fileTree, this.searchQuery.toLowerCase())
    }
  },
  methods: {
    handleSearch() {
      const uiStore = useUIStore()
      uiStore.setSearchQuery(this.searchQuery)
    },
    handleVideoSelect(video) {
      // Handle video selection
      this.$emit('select-video', video)
    },
    filterTree(items, query) {
      return items.reduce((filtered, item) => {
        if (item.type === 'folder') {
          const children = item.children ? this.filterTree(item.children, query) : []
          if (children.length > 0 || item.name.toLowerCase().includes(query)) {
            filtered.push({
              ...item,
              children
            })
          }
        } else if (item.name.toLowerCase().includes(query)) {
          filtered.push(item)
        }
        return filtered
      }, [])
    }
  }
}
</script>

<style scoped>
/* VSCode-like file explorer styling */
.file-explorer {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Custom scrollbar for file explorer */
.file-explorer::-webkit-scrollbar {
  width: 10px;
}

.file-explorer::-webkit-scrollbar-track {
  background: transparent;
}

.file-explorer::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.dark .file-explorer::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}
</style>
