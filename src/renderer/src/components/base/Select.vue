<template>
  <div>
    <label v-if="label" :for="id" class="block text-[13px] mb-2 font-medium">
      {{ label }}
    </label>
    <div class="relative">
      <select :id="id" :value="modelValue" :disabled="disabled" :class="[
        'w-full px-2 py-1 pr-8 rounded-smooth-md border appearance-none cursor-pointer text-[13px]',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2',
        // Light mode styles
        'bg-white border-zinc-200',
        'hover:border-zinc-300',
        'focus:border-zinc-300 focus:ring-zinc-200/50',
        // Dark mode styles
        'dark:bg-zinc-800/50 dark:border-zinc-700/50',
        'dark:hover:border-zinc-700',
        'dark:focus:border-zinc-600 dark:focus:ring-zinc-600/50',
        // Text colors
        'text-zinc-900 dark:text-zinc-100',
        // Disabled styles
        disabled && 'opacity-50 cursor-not-allowed hover:border-zinc-200 dark:hover:border-zinc-700',
        // Error styles
        error && 'border-red-500 dark:border-red-500 focus:ring-red-500/50 dark:focus:ring-red-500/50'
      ]" @change="handleChange">
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>
        <option v-for="option in normalizedOptions" :key="option.value" :value="option.value"
          :disabled="option.disabled">
          {{ option.label }}
        </option>
      </select>
      <!-- Custom dropdown icon -->
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <Icon name="chevron-down" :class="[
          'size-4',
          'text-zinc-500 dark:text-zinc-400'
        ]" />
      </div>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-500 dark:text-red-400">
      {{ error }}
    </p>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue'
import Icon from './Icon.vue'

export default defineComponent({
  name: 'Select',
  components: {
    Icon
  },
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      required: true,
      validator: (options) => {
        // Validate that options is an array and each item is either a string or has label/value
        return Array.isArray(options) && options.every(option =>
          typeof option === 'string' ||
          (typeof option === 'object' && 'label' in option && 'value' in option)
        )
      }
    },
    label: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    id: {
      type: String,
      default: () => `select-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    // Normalize options to always have label and value
    const normalizedOptions = computed(() => {
      return props.options.map(option => {
        if (typeof option === 'string') {
          return {
            label: option,
            value: option,
            disabled: false
          }
        }
        return {
          label: option.label,
          value: option.value,
          disabled: option.disabled || false
        }
      })
    })

    const handleChange = (event) => {
      const value = event.target.value
      emit('update:modelValue', value)
      emit('change', value)
    }

    return {
      normalizedOptions,
      handleChange
    }
  }
})
</script>

<style scoped>
/* Remove default select arrow in IE */
select::-ms-expand {
  display: none;
}

/* Ensure consistent appearance across browsers */
select {
  background-image: none;
}

/* Fix for Firefox not respecting appearance: none fully */
@-moz-document url-prefix() {
  select {
    text-indent: -2px;
  }
}
</style>