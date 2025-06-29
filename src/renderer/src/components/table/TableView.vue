<template>
  <div class="rounded-lg border bg-white">
    <table class="w-full">
      <thead>
        <tr class="border-b bg-zinc-50">
          <th
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Video
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Status
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Assignees
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Labels
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Duration
          </th>
          <th
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
          >
            Created
          </th>
          <th class="relative px-6 py-3">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-200 bg-white">
        <tr
          v-for="video in videos"
          :key="video.id"
          class="hover:bg-zinc-50"
        >
          <!-- Video Info -->
          <td class="whitespace-nowrap px-6 py-4">
            <div class="flex items-center">
              <div class="h-20 w-32 flex-shrink-0">
                <img
                  :src="video.thumbnail"
                  :alt="video.title"
                  class="h-full w-full rounded-md object-cover"
                />
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-zinc-900">
                  {{ video.title }}
                </div>
              </div>
            </div>
          </td>

          <!-- Status -->
          <td class="whitespace-nowrap px-6 py-4">
            <Badge variant="secondary">
              {{ getListName(video.listId) }}
            </Badge>
          </td>

          <!-- Assignees -->
          <td class="whitespace-nowrap px-6 py-4">
            <div class="flex -space-x-2">
              <Avatar
                v-for="assignee in video.assignees"
                :key="assignee.id"
                :src="assignee.avatar"
                :name="assignee.name"
                size="sm"
                class="ring-2 ring-white"
              />
            </div>
          </td>

          <!-- Labels -->
          <td class="px-6 py-4">
            <div class="flex flex-wrap gap-1">
              <Badge
                v-for="label in video.labels"
                :key="label.id"
                :variant="getLabelVariant(label.color)"
                class="text-xs"
              >
                {{ label.name }}
              </Badge>
            </div>
          </td>

          <!-- Duration -->
          <td class="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
            <div class="flex items-center gap-1">
              <Icon
                name="clock"
                size="sm"
              />
              {{ video.duration }}
            </div>
          </td>

          <!-- Created Date -->
          <td class="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
            {{ formatDate(video.createdAt) }}
          </td>

          <!-- Actions -->
          <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
            <Button
              variant="ghost"
              size="sm"
            >
              <Icon
                name="more-horizontal"
                size="sm"
              />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useProjectsStore } from '../../stores/projects'
  import { useVideosStore } from '../../stores/videos'
  import { storeToRefs } from 'pinia'
  import Avatar from '../base/Avatar.vue'
  import Badge from '../base/Badge.vue'
  import Button from '../base/Button.vue'
  import Icon from '../base/Icon.vue'

  const projectsStore = useProjectsStore()
  const videosStore = useVideosStore()

  const { activeProjectId } = storeToRefs(projectsStore)
  const { lists } = storeToRefs(videosStore)

  const videos = computed(() => videosStore.videosByProject(activeProjectId.value))

  const getListName = (listId) => {
    const list = lists.value.find((l) => l.id === listId)
    return list ? list.name : 'Unknown'
  }

  const getLabelVariant = (color) => {
    const colorMap = {
      red: 'danger',
      blue: 'secondary',
      green: 'success',
      yellow: 'warning',
      purple: 'secondary',
      orange: 'warning',
      indigo: 'secondary'
    }
    return colorMap[color] || 'default'
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }
</script>
