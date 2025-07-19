<!-- eslint-disable vue/no-reserved-component-names -->
<template>
  <div class="">
    <h2 class="text-[15px] font-semibold">General Settings</h2>
    <p class="text-[13px] text-current/50 mb-4">
      General settings for the app.
    </p>
    <div class="flex gap-5">
      <div class="w-1/3">
        <div>
          <h5 class="text-medium text-sm">
            Appearance
          </h5>
          <p class="text-xs text-current/50 leading-tight">
            Select the appearance of the app.
          </p>
        </div>
      </div>
      <div class="w-2/3">
        <Select v-model="appearance" :options="appearanceOptions" placeholder="Select appearance" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import Select from '@/components/base/Select.vue'

export default {
  name: 'GeneralSettings',
  components: {
    Select
  },
  setup() {
    const appearance = ref('System')

    const appearanceOptions = [
      'System',
      'Light',
      'Dark'
    ]

    return {
      appearance,
      appearanceOptions
    }
  }
}
</script>