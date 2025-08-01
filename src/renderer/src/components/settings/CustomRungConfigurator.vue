<template>
<div class="space-y-4">
  <!-- Header with Add button -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-[13px] font-medium">Custom Quality Rungs</h3>
      <p class="text-xs text-current/50 mt-0">Configure multiple quality levels for encoding</p>
    </div>
    <Button @click="addRung" size="sm" icon-name="plus">
      Add Rung
    </Button>
  </div>

  <!-- Rungs List -->
  <div class="space-y-2">
    <div v-for="(rung, index) in localRungs" :key="rung.id"
      :class="[
        'bg-zinc-800/50 rounded-lg p-3 shadow-xs transition-opacity',
        !rung.enabled && 'opacity-50'
      ]">

      <div class="flex items-center gap-4">
        <!-- Resolution Selector -->
        <Dropdown
          class="w-30"
          :modelValue="rung.height"
          @update:modelValue="(value) => updateRungHeight(index, value)"
          :options="resolutionOptions"
          size="sm"
          placeholder="Select resolution" />

        <!-- Quality Slider -->
        <div class="flex-1 flex items-center gap-2">
          <span class="text-[9px] text-zinc-500">Fast</span>
          <input type="range" min="1" max="5" v-model.number="rung.quality"
            class="flex-1 h-1 accent-blue-500" />
          <span class="text-[9px] text-zinc-500">Best</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2.5">
          <!-- Enable/Disable Toggle -->
          <ToggleSwitch v-model="rung.enabled" size="md" />

          <!-- Delete Button -->
          <Button
            @click="removeRung(index)"
            size="sm"
            icon-name="trash"
            variant="ghost"
            :disabled="localRungs.length <= 1" />
        </div>
      </div>

    </div>
  </div>

  <!-- Empty State -->
  <div v-if="localRungs.length === 0"
    class="text-center py-8 text-xs text-zinc-500">
    No quality rungs configured. Click "Add Rung" to create one.
  </div>
</div>
</template>

<script>
import { ref, watch, computed } from 'vue'
import Icon from '@/components/base/Icon.vue'
import Button from '@/components/base/Button.vue'
import ToggleSwitch from '@/components/base/ToggleSwitch.vue'
import Dropdown from '@/components/base/Dropdown.vue'
import { mapQualityToCRF, RESOLUTION_OPTIONS } from '@/utils/encoding-utils'

export default {
  name: 'CustomRungConfigurator',
  components: {
    Icon,
    Button,
    ToggleSwitch,
    Dropdown
  },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Generate 8-character ID using random alphanumeric characters
    const generateId = () => {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyz'
      let id = ''
      for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
      }
      return id
    }
    
    // Deep copy of rungs for editing to avoid shared references
    const localRungs = ref(props.modelValue.map(rung => ({ ...rung })))

    // Resolution options
    const resolutionOptions = RESOLUTION_OPTIONS

    // Quality labels
    const qualityLabels = ['Low', 'Medium-Low', 'Medium', 'Medium-High', 'High']

    // Get CRF value for quality
    const getCRF = (quality) => {
      return mapQualityToCRF(quality)
    }

    // Get resolution display string
    const getResolutionDisplay = (height) => {
      const option = resolutionOptions.find(r => r.value === height)
      return option ? option.label : `${height}p`
    }

    // Estimate bitrate based on resolution and quality
    const estimateBitrate = (height, quality) => {
      // Rough estimates for display purposes
      const baseBitrates = {
        240: 300,
        360: 600,
        480: 1000,
        540: 1200,
        720: 2000,
        1080: 4000,
        1440: 8000,
        2160: 16000,
        4320: 40000
      }

      const base = baseBitrates[height] || 4000
      const qualityMultiplier = 0.6 + (quality - 1) * 0.225 // 0.6 to 1.5
      const bitrate = Math.round(base * qualityMultiplier)

      if (bitrate >= 10000) {
        return `${Math.round(bitrate / 1000)} Mbps`
      } else if (bitrate >= 1000) {
        return `${(bitrate / 1000).toFixed(1)} Mbps`
      } else {
        return `${bitrate} Kbps`
      }
    }

    // Add new rung
    const addRung = () => {
      // Get the next logical resolution
      let nextHeight = 1080 // default

      if (localRungs.value.length > 0) {
        // Get the highest resolution currently in use
        const highestHeight = Math.max(...localRungs.value.map(r => r.height))

        // Find the index of this resolution in our options
        const currentIndex = resolutionOptions.findIndex(r => r.value === highestHeight)

        if (currentIndex !== -1 && currentIndex < resolutionOptions.length - 1) {
          // Use the next higher resolution
          nextHeight = resolutionOptions[currentIndex + 1].value
        } else if (currentIndex === resolutionOptions.length - 1) {
          // Already at highest, start from a lower resolution
          nextHeight = resolutionOptions[0].value
        }
      }

      const newRung = {
        id: `${nextHeight}p_${generateId()}`,
        height: nextHeight,
        quality: 3,
        enabled: true
      }

      localRungs.value.push(newRung)
    }

    // Remove rung
    const removeRung = (index) => {
      if (localRungs.value.length > 1) {
        localRungs.value.splice(index, 1)
      }
    }
    
    // Update rung height and generate new ID
    const updateRungHeight = (index, newHeight) => {
      const updatedRungs = [...localRungs.value]
      updatedRungs[index] = {
        ...updatedRungs[index],
        height: newHeight,
        id: `${newHeight}p_${generateId()}` // Generate new ID when height changes
      }
      localRungs.value = updatedRungs
    }


    // Watch for prop changes
    watch(() => props.modelValue, (newValue) => {
      // Only update if actually different to prevent circular updates
      if (JSON.stringify(newValue) !== JSON.stringify(localRungs.value)) {
        // Deep copy to avoid shared references
        localRungs.value = newValue.map(rung => ({ ...rung }))
      }
    }, { deep: true })

    // Emit changes
    watch(localRungs, (newValue) => {
      // Only emit if actually different from props to prevent circular updates
      if (JSON.stringify(newValue) !== JSON.stringify(props.modelValue)) {
        // Deep copy to ensure parent doesn't share references
        emit('update:modelValue', newValue.map(rung => ({ ...rung })))
      }
    }, { deep: true })

    return {
      localRungs,
      resolutionOptions,
      qualityLabels,
      getCRF,
      getResolutionDisplay,
      estimateBitrate,
      addRung,
      removeRung,
      updateRungHeight
    }
  }
}
</script>