<template>
<div class="relative" ref="dropdownRef">
  <!-- Visual button that shows current selection -->
  <Button
    :size="size"
    :variant="variant"
    :chevron="true"
    @click="handleButtonClick"
    class="text-left"
    :class="buttonClass"
    :disabled="disabled">
    <span class="truncate">{{ displayValue }}</span>
  </Button>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Button from './Button.vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  optionLabel: {
    type: String,
    default: 'label'
  },
  optionValue: {
    type: String,
    default: 'value'
  },
  placeholder: {
    type: String,
    default: 'Select an option'
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['sm', 'default', 'lg'].includes(value)
  },
  variant: {
    type: String,
    default: 'default'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  buttonClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const dropdownRef = ref(null)
let menuActionCleanup = null

// Generate unique ID for this dropdown instance
const dropdownId = `dropdown_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Helper to get option value
const getOptionValue = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.optionValue]
  }
  return option
}

// Helper to get option label
const getOptionLabel = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.optionLabel]
  }
  return String(option)
}

// Display value for the button
const displayValue = computed(() => {
  if (!props.modelValue && props.modelValue !== 0) {
    return props.placeholder
  }

  const selectedOption = props.options.find(
    option => getOptionValue(option) === props.modelValue
  )

  return selectedOption ? getOptionLabel(selectedOption) : props.placeholder
})

// Handle button click - show native menu
const handleButtonClick = async () => {
  if (props.disabled || !dropdownRef.value) return

  // Get button position
  const rect = dropdownRef.value.getBoundingClientRect()

  // Build menu template from options with radio type
  const menuTemplate = props.options.map((option, index) => {
    const value = getOptionValue(option)
    const label = getOptionLabel(option)
    const isSelected = value === props.modelValue

    return {
      label: label,
      type: 'radio',
      checked: isSelected,
      action: `dropdown:select:${dropdownId}`,
      data: { value, index }
    }
  })

  // Show the menu below the button
  await window.api.menu.showContext(menuTemplate, {
    x: Math.round(rect.left),
    y: Math.round(rect.bottom)
  })
}

// Handle menu action
const handleMenuAction = (action, data) => {
  if (action === `dropdown:select:${dropdownId}` && data) {
    // Convert back to number if the original modelValue was a number
    const emitValue = typeof props.modelValue === 'number' && typeof data.value === 'string'
      ? Number(data.value)
      : data.value
    emit('update:modelValue', emitValue)
  }
}

// Setup menu action listener
onMounted(() => {
  menuActionCleanup = window.api.menu.onAction(handleMenuAction)
})

// Cleanup listener
onBeforeUnmount(() => {
  if (menuActionCleanup) {
    menuActionCleanup()
  }
})
</script>