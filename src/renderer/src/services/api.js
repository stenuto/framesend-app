/**
 * API Service Layer
 * Provides clean methods for all API endpoints with centralized error handling
 * 
 * IMPORTANT: When adding or modifying API endpoints, update the API specification
 * document at /API_SPEC.md to keep the documentation in sync.
 */

class ApiService {
  constructor() {
    this.baseURL = '/api'
    this.isOffline = false
    this.hasShownOfflineWarning = false
  }

  /**
   * Make an API request
   * @private
   */
  async request(method, url, data = null, headers = {}) {
    // Ensure URL has /api prefix
    const fullUrl = url.startsWith('/api') ? url : `${this.baseURL}${url}`
    const response = await window.api.request(method, fullUrl, data, headers)
    return response.data
  }

  // ========== Projects ==========

  /**
   * Get all projects
   */
  async getProjects() {
    return this.request('GET', '/projects')
  }

  /**
   * Get single project
   */
  async getProject(id) {
    return this.request('GET', `/projects/${id}`)
  }

  /**
   * Create new project
   */
  async createProject(data) {
    return this.request('POST', '/projects', data)
  }

  /**
   * Update project
   */
  async updateProject(id, data) {
    return this.request('PUT', `/projects/${id}`, data)
  }

  /**
   * Delete project
   */
  async deleteProject(id) {
    return this.request('DELETE', `/projects/${id}`)
  }

  /**
   * Get project content (folders and videos)
   */
  async getProjectContent(projectId) {
    return this.request('GET', `/projects/${projectId}/content`)
  }

  // ========== Videos ==========

  /**
   * Create new video
   */
  async createVideo(data) {
    return this.request('POST', '/videos', data)
  }

  /**
   * Get video details
   */
  async getVideo(id) {
    return this.request('GET', `/videos/${id}`)
  }

  /**
   * Update video
   */
  async updateVideo(id, data) {
    return this.request('PUT', `/videos/${id}`, data)
  }

  /**
   * Delete video
   */
  async deleteVideo(id) {
    return this.request('DELETE', `/videos/${id}`)
  }

  // ========== Folders ==========

  /**
   * Create new folder
   */
  async createFolder(data) {
    return this.request('POST', '/folders', data)
  }

  /**
   * Update folder
   */
  async updateFolder(id, data) {
    return this.request('PUT', `/folders/${id}`, data)
  }

  /**
   * Delete folder
   */
  async deleteFolder(id) {
    return this.request('DELETE', `/folders/${id}`)
  }

  // ========== Auth ==========

  /**
   * Set authentication token
   */
  async setAuthToken(token) {
    await window.api.setAuthToken(token)
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken() {
    await window.api.clearAuthToken()
  }
}

// Export singleton instance
export const apiService = new ApiService()