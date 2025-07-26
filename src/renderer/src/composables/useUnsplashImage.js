import { ref, onMounted } from 'vue'

export function useUnsplashImage(seed) {
  const imageUrl = ref('')
  const loading = ref(true)
  const error = ref(null)

  const fetchImage = async () => {
    try {
      // Use seed to ensure consistency - same seed gets same image
      const response = await fetch(
        `https://api.unsplash.com/photos/random?client_id=dk69oOESKog1rTbMpF4Lg1glz1wYNU8OfvwSuTLfaTk&query=technology,abstract&w=640&h=360&seed=${seed}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const data = await response.json()
      // Use the regular size URL with specific dimensions
      imageUrl.value = data.urls.regular || data.urls.full
    } catch (err) {
      console.error('Error fetching Unsplash image:', err)
      // Fallback to a default placeholder
      imageUrl.value = `https://source.unsplash.com/640x360/?technology,abstract&sig=${seed}`
      error.value = err
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchImage()
  })

  return {
    imageUrl,
    loading,
    error
  }
}