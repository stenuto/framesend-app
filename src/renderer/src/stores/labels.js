import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLabelsStore = defineStore('labels', () => {
  // State
  const labels = ref([
    {
      id: '1',
      name: 'Urgent',
      color: 'red',
      shade: 500
    },
    {
      id: '2',
      name: 'Review',
      color: 'blue',
      shade: 100
    },
    {
      id: '3',
      name: 'Enhancement',
      color: 'green',
      shade: 100
    },
    {
      id: '4',
      name: 'Animation',
      color: 'purple',
      shade: 500
    },
    {
      id: '5',
      name: 'Social Media',
      color: 'orange',
      shade: 100
    },
    {
      id: '6',
      name: 'Draft',
      color: 'zinc',
      shade: 100
    },
    {
      id: '7',
      name: 'Final',
      color: 'emerald',
      shade: 500
    }
  ])

  // Available Tailwind colors and shades
  const availableColors = [
    'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 
    'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 
    'rose', 'zinc', 'slate', 'neutral', 'stone'
  ]

  const availableShades = [100, 500]

  // Getters
  const labelById = computed(() => {
    return (id) => labels.value.find(label => label.id === id)
  })

  const labelsByIds = computed(() => {
    return (ids) => labels.value.filter(label => ids.includes(label.id))
  })

  // Actions
  function createLabel(labelData) {
    const newLabel = {
      id: Date.now().toString(),
      name: labelData.name,
      color: labelData.color || 'zinc',
      shade: labelData.shade || 500
    }
    labels.value.push(newLabel)
    return newLabel
  }

  function updateLabel(id, updates) {
    const index = labels.value.findIndex(label => label.id === id)
    if (index !== -1) {
      labels.value[index] = { ...labels.value[index], ...updates }
    }
  }

  function deleteLabel(id) {
    const index = labels.value.findIndex(label => label.id === id)
    if (index !== -1) {
      labels.value.splice(index, 1)
    }
  }

  function reorderLabels(newOrder) {
    labels.value = newOrder
  }

  // Helper function to get Tailwind classes for a label
  function getLabelClasses(label) {
    const bgClass = `bg-${label.color}-${label.shade}`
    const textClass = label.shade <= 400 ? `text-${label.color}-900` : `text-${label.color}-50`
    return {
      background: bgClass,
      text: textClass,
      combined: `${bgClass} ${textClass}`
    }
  }

  return {
    // State
    labels,
    availableColors,
    availableShades,
    
    // Getters
    labelById,
    labelsByIds,
    
    // Actions
    createLabel,
    updateLabel,
    deleteLabel,
    reorderLabels,
    getLabelClasses
  }
})