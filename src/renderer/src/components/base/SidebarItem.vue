<template>
  <div 
    :class="[
      'group flex items-center gap-2 px-2.5 py-1.5 rounded-smooth-lg cursor-pointer',
      highlighted 
        ? 'dark:bg-zinc-600/20 bg-zinc-500/20 dark:text-zinc-50 text-zinc-800' 
        : 'hover:dark:bg-zinc-600/10 hover:bg-zinc-500/10'
    ]"
    @click="$emit('click')"
  >
    <!-- Icon -->
    <Icon 
      v-if="iconName" 
      :name="iconName" 
      :class="[
        'size-3.5 flex-shrink-0',
        iconClass,
        highlighted ? '' : 'text-zinc-500 dark:text-zinc-400'
      ]"
    />
    
    <!-- Content -->
    <div class="flex-1 min-w-0 flex items-center justify-between">
      <!-- Name -->
      <span 
        :class="[
          'text-[13px] font-regular truncate',
          highlighted ? 'text-current' : 'group-hover:text-current'
        ]"
      >
        {{ name }}
      </span>
      
      <!-- Right side content slot -->
      <slot name="right" />
    </div>
    
    <!-- Default slot for any additional content -->
    <slot />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
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
  }
})

const emit = defineEmits(['click'])
</script>