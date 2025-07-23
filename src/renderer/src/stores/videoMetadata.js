import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useVideoMetadataStore = defineStore('videoMetadata', () => {
  // State - Map of jobId to metadata
  const metadata = ref(new Map())
  
  // Actions
  
  /**
   * Initialize metadata for a video
   */
  function initializeMetadata(jobId, initialData) {
    metadata.value.set(jobId, {
      name: initialData.name,
      originalName: initialData.name,
      description: '',
      tags: [],
      ...initialData,
      updatedAt: new Date()
    })
  }
  
  /**
   * Update video metadata
   */
  function updateMetadata(jobId, updates) {
    const current = metadata.value.get(jobId)
    if (current) {
      metadata.value.set(jobId, {
        ...current,
        ...updates,
        updatedAt: new Date()
      })
    }
  }
  
  /**
   * Update video name specifically
   */
  function updateVideoName(jobId, newName) {
    updateMetadata(jobId, { name: newName })
  }
  
  /**
   * Get metadata for a video
   */
  function getMetadata(jobId) {
    return metadata.value.get(jobId) || null
  }
  
  /**
   * Get video name (with fallback)
   */
  function getVideoName(jobId, fallbackName) {
    const meta = metadata.value.get(jobId)
    return meta?.name || fallbackName
  }
  
  /**
   * Remove metadata (when job is removed)
   */
  function removeMetadata(jobId) {
    metadata.value.delete(jobId)
  }
  
  /**
   * Clear all metadata
   */
  function clearAllMetadata() {
    metadata.value.clear()
  }
  
  /**
   * Check if name has been edited
   */
  function isNameEdited(jobId) {
    const meta = metadata.value.get(jobId)
    return meta && meta.name !== meta.originalName
  }
  
  return {
    // State
    metadata,
    
    // Actions
    initializeMetadata,
    updateMetadata,
    updateVideoName,
    getMetadata,
    getVideoName,
    removeMetadata,
    clearAllMetadata,
    isNameEdited
  }
})