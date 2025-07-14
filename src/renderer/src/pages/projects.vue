<template>
  <div class="flex flex-col h-full bg-zinc-900">
    <!-- Project Header -->
    <div class="border-b border-zinc-700 px-6 py-4">
      <h1 class="text-2xl font-semibold text-zinc-100">{{ selectedProject?.name }}</h1>
      <p class="text-sm text-zinc-400 mt-1">{{ projectFolders.length }} folders • {{ getTotalVideos() }} videos</p>
    </div>

    <!-- Folders & Videos -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Draggable Folders -->
      <draggable
        v-model="projectFolders"
        :animation="200"
        handle=".folder-handle"
        item-key="id"
        class="space-y-6"
      >
        <template #item="{ element: folder }">
          <div :key="folder.id">
            <!-- Folder Header -->
            <div class="flex items-center gap-3 mb-3">
              <Icon name="menu" class="folder-handle w-4 h-4 text-zinc-500 cursor-move" />
              <Icon name="folder" class="w-5 h-5 text-zinc-400" />
              <h2 class="text-lg font-medium text-zinc-200">{{ folder.name }}</h2>
              <span class="text-sm text-zinc-500">{{ getVideosByFolder(folder.id).length }} videos</span>
            </div>

            <!-- Videos Grid -->
            <div class="min-h-[120px] p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
              <draggable
                :model-value="getVideosByFolder(folder.id)"
                @update:model-value="updateFolderVideos(folder.id, $event)"
                :group="{ name: 'videos', pull: true, put: true }"
                :animation="150"
                item-key="id"
                class="grid grid-cols-4 gap-4"
                :empty-insert-threshold="100"
              >
                <template #item="{ element: video }">
                  <div
                    :key="video.id"
                    class="video-card"
                  >
                    <!-- Video Thumbnail -->
                    <div class="aspect-video bg-zinc-700 rounded-md mb-2 flex items-center justify-center">
                      <Icon name="film" class="w-8 h-8 text-zinc-500" />
                    </div>
                    
                    <!-- Video Info -->
                    <h3 class="text-sm text-zinc-200 truncate mb-1" :title="video.name">{{ video.name }}</h3>
                    <div class="flex items-center justify-between text-xs text-zinc-500">
                      <span>{{ video.duration }}</span>
                      <span>{{ video.size }}</span>
                    </div>
                  </div>
                </template>

                <!-- Empty State -->
                <template #footer>
                  <div 
                    v-if="getVideosByFolder(folder.id).length === 0"
                    class="col-span-4 flex flex-col items-center justify-center py-8 text-zinc-600"
                  >
                    <Icon name="folder" class="w-8 h-8 mb-2" />
                    <p class="text-sm">Drop videos here</p>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { storeToRefs } from 'pinia'
import Icon from '@components/base/Icon.vue'
import draggable from 'vuedraggable'

export default {
  name: 'ProjectsPage',
  components: {
    Icon,
    draggable
  },
  setup() {
    const projectsStore = useProjectsStore()
    const { selectedProject, projectFolders } = storeToRefs(projectsStore)
    const { getVideosByFolder, moveVideo, moveFolder, videos } = projectsStore

    const getTotalVideos = () => {
      return projectFolders.value.reduce((total, folder) => {
        return total + getVideosByFolder(folder.id).length
      }, 0)
    }

    // Handle video reordering within/between folders
    const updateFolderVideos = (folderId, newVideos) => {
      // Update each video's folderId and orderIndex
      newVideos.forEach((video, index) => {
        const originalVideo = videos.find(v => v.id === video.id)
        if (originalVideo) {
          originalVideo.folderId = folderId
          originalVideo.orderIndex = index
        }
      })
    }

    return {
      selectedProject,
      projectFolders,
      getVideosByFolder,
      getTotalVideos,
      updateFolderVideos
    }
  }
}
</script>

<style scoped>
.video-card {
  padding: 0.75rem;
  background-color: rgb(39 39 42);
  border-radius: 0.5rem;
  border: 1px solid rgb(63 63 70);
  transition: all 0.3s;
  cursor: move;
}

.video-card:hover {
  border-color: rgb(82 82 91);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Vuedraggable ghost styling */
.sortable-ghost {
  opacity: 0.5;
}

/* Vuedraggable drag styling */
.sortable-drag {
  opacity: 0 !important;
}

/* Vuedraggable chosen item */
.sortable-chosen {
  opacity: 0.5;
}

/* Folder handle hover effect */
.folder-handle:hover {
  color: rgb(161 161 170);
}
</style>