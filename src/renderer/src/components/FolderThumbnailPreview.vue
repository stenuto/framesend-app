<template>
  <div class="aspect-video bg-zinc-900/50 relative overflow-hidden">
    <!-- Empty folder - show folder icon -->
    <div v-if="items.length === 0" class="flex items-center justify-center h-full">
      <Icon name="folder" class="size-20 text-zinc-600" :stroke-width="1.5" />
    </div>

    <!-- 1 item - left half filled, right half empty -->
    <div v-else-if="items.length === 1" class="flex h-full">
      <div class="w-1/2 relative">
        <!-- Video thumbnail -->
        <img v-if="items[0].type === 'video'" 
             src="https://placehold.co/640x360" 
             :alt="`${items[0].name} thumbnail`" 
             class="w-full h-full object-cover" />
        <!-- Folder icon -->
        <div v-else class="w-full h-full bg-zinc-800/50 flex items-center justify-center">
          <Icon name="folder" class="size-12 text-zinc-600" :stroke-width="1.5" />
        </div>
      </div>
      <div class="w-1/2 bg-zinc-800/50"></div>
    </div>

    <!-- 2 items - split equally -->
    <div v-else-if="items.length === 2" class="flex h-full">
      <div v-for="(item, index) in items.slice(0, 2)" 
           :key="item.id" 
           class="w-1/2 relative"
           :class="{ 'border-l border-zinc-900/50': index === 1 }">
        <!-- Video thumbnail -->
        <img v-if="item.type === 'video'" 
             src="https://placehold.co/640x360" 
             :alt="`${item.name} thumbnail`" 
             class="w-full h-full object-cover" />
        <!-- Folder icon -->
        <div v-else class="w-full h-full bg-zinc-800/50 flex items-center justify-center">
          <Icon name="folder" class="size-12 text-zinc-600" :stroke-width="1.5" />
        </div>
      </div>
    </div>

    <!-- 3+ items - first takes 2/3, others stack on right 1/3 -->
    <div v-else class="flex h-full">
      <!-- Main thumbnail (left 2/3) -->
      <div class="w-2/3 relative">
        <!-- Video thumbnail -->
        <img v-if="items[0].type === 'video'" 
             src="https://placehold.co/640x360" 
             :alt="`${items[0].name} thumbnail`" 
             class="w-full h-full object-cover" />
        <!-- Folder icon -->
        <div v-else class="w-full h-full bg-zinc-800/50 flex items-center justify-center">
          <Icon name="folder" class="size-16 text-zinc-600" :stroke-width="1.5" />
        </div>
      </div>
      
      <!-- Right column (1/3) with 2 stacked thumbnails -->
      <div class="w-1/3 flex flex-col">
        <!-- Top thumbnail -->
        <div class="h-1/2 relative border-l border-zinc-900/50">
          <!-- Video thumbnail -->
          <img v-if="items[1].type === 'video'" 
               src="https://placehold.co/640x360" 
               :alt="`${items[1].name} thumbnail`" 
               class="w-full h-full object-cover" />
          <!-- Folder icon -->
          <div v-else class="w-full h-full bg-zinc-800/50 flex items-center justify-center">
            <Icon name="folder" class="size-10 text-zinc-600" :stroke-width="1.5" />
          </div>
        </div>
        
        <!-- Bottom thumbnail (with +N overlay if more than 3 items) -->
        <div class="h-1/2 relative border-l border-t border-zinc-900/50">
          <!-- Video thumbnail -->
          <img v-if="items[2].type === 'video'" 
               src="https://placehold.co/640x360" 
               :alt="`${items[2].name} thumbnail`" 
               class="w-full h-full object-cover" />
          <!-- Folder icon -->
          <div v-else class="w-full h-full bg-zinc-800/50 flex items-center justify-center">
            <Icon name="folder" class="size-10 text-zinc-600" :stroke-width="1.5" />
          </div>
          
          <!-- +N overlay for additional items -->
          <div v-if="items.length > 3" 
               class="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span class="text-white text-sm font-medium">
              +{{ items.length - 3 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted } from 'vue'
import Icon from '@/components/base/Icon.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

onMounted(() => {
  console.log('FolderThumbnailPreview mounted with items:', props.items)
})
</script>