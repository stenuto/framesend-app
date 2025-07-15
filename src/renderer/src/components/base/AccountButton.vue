<template>
  <div class="flex items-center gap-2 mx-3 p-2 rounded-smooth-xl hover:bg-zinc-700/50 cursor-pointer"
    @click="$emit('click')">
    <!-- Avatar -->
    <component :is="avatarComponent" v-bind="avatarProps" class="size-8" />

    <!-- Account Info -->
    <div class="flex gap-2.5 items-center">
      <div class="flex flex-col gap-[3px] leading-none">
        <div class="text-[15px] text-zinc-200 leading-none">{{ name }}</div>
        <div class="text-[13px] font-regular text-zinc-500 leading-none">{{ subtitle }}</div>
      </div>
    </div>

    <!-- Chevron Icon -->
    <div class="flex-1 flex justify-end">
      <Icon name="chevrons-up-down" class="size-4 text-zinc-500" stroke-width="2.5" />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import Icon from './Icon.vue'
import Avatar from './Avatar.vue'

export default {
  name: 'AccountButton',
  components: {
    Icon,
    Avatar
  },
  props: {
    type: {
      type: String,
      default: 'team', // 'team' or 'user'
      validator: (value) => ['team', 'user'].includes(value)
    },
    name: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: 'https://placehold.co/100'
    },
    avatarAlt: {
      type: String,
      default: ''
    },
    // For user avatars with initials
    initials: {
      type: String,
      default: ''
    }
  },
  emits: ['click'],
  setup(props) {
    const avatarComponent = computed(() => {
      return props.type === 'user' && props.initials ? 'Avatar' : 'img'
    })

    const avatarProps = computed(() => {
      if (props.type === 'user' && props.initials) {
        return {
          name: props.name,
          initials: props.initials,
          size: 'sm',
          className: 'rounded-smooth-md'
        }
      }
      return {
        src: props.avatarUrl,
        alt: props.avatarAlt || props.name,
        class: 'rounded-smooth-md'
      }
    })

    return {
      avatarComponent,
      avatarProps
    }
  }
}
</script>