<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between text-xs">
      <span class="text-zinc-500 dark:text-zinc-400">{{ leftLabel }}</span>
      <span class="text-zinc-600 dark:text-zinc-300 font-medium">
        Quality: {{ modelValue }}
      </span>
      <span class="text-zinc-500 dark:text-zinc-400">{{ rightLabel }}</span>
    </div>
    <div class="relative">
      <input
        type="range"
        :value="modelValue"
        @input="handleInput"
        min="1"
        max="5"
        step="1"
        class="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
      />
      <div class="flex justify-between mt-1">
        <span 
          v-for="n in 5" 
          :key="n"
          class="text-xs text-zinc-400 dark:text-zinc-500"
          :class="{ 'text-cyan-600 dark:text-cyan-400': n === modelValue }"
        >
          {{ n }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QualitySlider',
  props: {
    modelValue: {
      type: Number,
      required: true,
      validator: (value) => value >= 1 && value <= 5
    },
    leftLabel: {
      type: String,
      default: 'Faster encoding'
    },
    rightLabel: {
      type: String,
      default: 'Higher quality'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleInput = (event) => {
      emit('update:modelValue', parseInt(event.target.value))
    }

    return {
      handleInput
    }
  }
}
</script>

<style scoped>
/* Custom slider styles */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  background: #06b6d4; /* cyan-500 */
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background: #0891b2; /* cyan-600 */
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #06b6d4; /* cyan-500 */
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  background: #0891b2; /* cyan-600 */
}

/* Dark mode adjustments */
.dark .slider::-webkit-slider-thumb {
  background: #22d3ee; /* cyan-400 */
}

.dark .slider::-webkit-slider-thumb:hover {
  background: #06b6d4; /* cyan-500 */
}

.dark .slider::-moz-range-thumb {
  background: #22d3ee; /* cyan-400 */
}

.dark .slider::-moz-range-thumb:hover {
  background: #06b6d4; /* cyan-500 */
}
</style>