<template>
  <div class="aspect-video bg-zinc-900/50 relative overflow-hidden">
    <!-- Empty folder - show folder icon -->
    <div v-if="items.length === 0" class="flex items-center justify-center h-full">
      <Icon name="folder" class="size-12 text-zinc-600" :stroke-width="1.5" />
    </div>

    <!-- 1 video - left half filled, right half empty -->
    <div v-else-if="items.length === 1" class="flex h-full">
      <div class="w-1/2 relative">
        <PlaceholderImage :seed="items[0].id" :alt="`${items[0].name} thumbnail`" />
      </div>
      <div class="w-1/2 bg-zinc-800/50"></div>
    </div>

    <!-- 2 videos - split equally -->
    <div v-else-if="items.length === 2" class="flex h-full gap-0.5">
      <div v-for="(item, index) in items.slice(0, 2)" :key="item.id" class="w-1/2 relative"
        :class="{ 'border-l border-zinc-900/50': index === 1 }">
        <PlaceholderImage :seed="item.id" :alt="`${item.name} thumbnail`" />
      </div>
    </div>

    <!-- 3+ videos - first takes 2/3, others stack on right 1/3 -->
    <div v-else class="flex h-full">
      <!-- Main thumbnail (left 2/3) -->
      <div class="w-2/3 relative">
        <PlaceholderImage :seed="items[0].id" :alt="`${items[0].name} thumbnail`" />
      </div>

      <!-- Right column (1/3) with 2 stacked thumbnails -->
      <div class="w-1/3 flex flex-col">
        <!-- Top thumbnail -->
        <div class="h-1/2 relative border-l border-zinc-900/50">
          <PlaceholderImage :seed="items[1].id" :alt="`${items[1].name} thumbnail`" />
        </div>

        <!-- Bottom thumbnail (with +N overlay if more than 3 videos) -->
        <div class="h-1/2 relative border-l border-t border-zinc-900/50">
          <PlaceholderImage :seed="items[2].id" :alt="`${items[2].name} thumbnail`" />

          <!-- +N overlay for additional videos -->
          <div v-if="items.length > 3" class="absolute inset-0 bg-black/60 flex items-center justify-center">
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
import { defineProps } from 'vue'
import Icon from '@/components/base/Icon.vue'
import PlaceholderImage from '@/components/PlaceholderImage.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})
</script>