<template>
  <div class="encoding-settings-page p-6">
    <div class="mb-6">
      <button 
        @click="router.navigate('settings')"
        class="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <Icon name="arrow-left" class="size-4" />
        Back to Settings
      </button>
    </div>
    
    <h1 class="text-2xl font-bold text-zinc-100 mb-6">Encoding Settings</h1>
    
    <div class="space-y-6">
      <!-- Video Encoding Settings -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <h2 class="text-lg font-semibold text-zinc-100 mb-4">Video Encoding</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">
              Default Video Codec
            </label>
            <select class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100">
              <option>H.264</option>
              <option>H.265 (HEVC)</option>
              <option>VP9</option>
              <option>AV1</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">
              Default Quality
            </label>
            <select class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100">
              <option>4K (2160p)</option>
              <option>1080p</option>
              <option>720p</option>
              <option>480p</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">
              Bitrate (Mbps)
            </label>
            <input 
              type="number" 
              value="10"
              class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100"
            />
          </div>
        </div>
      </div>
      
      <!-- Audio Encoding Settings -->
      <div class="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <h2 class="text-lg font-semibold text-zinc-100 mb-4">Audio Encoding</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">
              Audio Codec
            </label>
            <select class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100">
              <option>AAC</option>
              <option>MP3</option>
              <option>Opus</option>
              <option>FLAC</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">
              Sample Rate
            </label>
            <select class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100">
              <option>48000 Hz</option>
              <option>44100 Hz</option>
              <option>22050 Hz</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-2">
              Audio Bitrate (kbps)
            </label>
            <input 
              type="number" 
              value="192"
              class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-zinc-100"
            />
          </div>
        </div>
      </div>
      
      <!-- Save Button -->
      <div class="flex justify-end">
        <button class="px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors">
          Save Encoding Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouterStore } from '../../stores/router'
import Icon from '../../components/base/Icon.vue'

export default {
  name: 'EncodingSettingsPage',
  components: {
    Icon
  },
  meta: {
    title: 'Encoding Settings',
    parent: 'settings'
  },
  setup() {
    const router = useRouterStore()
    return { router }
  }
}
</script>