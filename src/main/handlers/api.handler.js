import { net } from 'electron'

// Default API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'
let authToken = null // Will be set when user authenticates

/**
 * Set the authentication token
 * @param {string} token - JWT token from Clerk
 */
export function setAuthToken(token) {
  authToken = token
}

/**
 * Register API request handlers
 */
export default function registerApiHandlers(ipcMain) {
  // Generic API request handler
  ipcMain.handle('api:request', async (event, { method, url, data, headers = {} }) => {
    try {
      // Log the request
      console.log(`📡 ${method} ${url}`, data ? data : '')
      
      // MOCK MODE - Return mock data without making HTTP requests
      // When server is ready, uncomment the HTTP request code below
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Return mock data based on the endpoint
      let mockData = null
      
      if (method === 'POST') {
        // Create operations return the created object with a generated ID
        mockData = {
          ...data,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      } else if (method === 'PUT' || method === 'PATCH') {
        // Update operations return the updated object
        mockData = {
          ...data,
          updatedAt: new Date().toISOString()
        }
      } else if (method === 'DELETE') {
        // Delete operations return success
        mockData = { success: true }
      } else if (method === 'GET') {
        // GET operations return empty data for now
        if (url.includes('/projects') && !url.includes('/')) {
          mockData = [] // Empty projects list
        } else if (url.includes('/content')) {
          mockData = { folders: [], videos: [] } // Empty content
        } else {
          mockData = {}
        }
      }
      
      return {
        success: true,
        status: 200,
        data: mockData,
        headers: {}
      }
      
      /* REAL HTTP IMPLEMENTATION - Uncomment when server is ready
      // Build full URL
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
      
      // Build headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      }
      
      // Add auth token if available
      if (authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`
      }
      
      // Create request
      const request = net.request({
        method: method,
        url: fullUrl,
        headers: requestHeaders
      })
      
      // Send data if present
      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        request.write(JSON.stringify(data))
      }
      
      // Handle response
      return new Promise((resolve, reject) => {
        let responseData = ''
        
        request.on('response', (response) => {
          const { statusCode, headers } = response
          
          response.on('data', (chunk) => {
            responseData += chunk
          })
          
          response.on('end', () => {
            // Parse response
            let parsedData = null
            try {
              parsedData = responseData ? JSON.parse(responseData) : null
            } catch (e) {
              parsedData = responseData
            }
            
            // Log response for successful requests
            if (statusCode >= 200 && statusCode < 300) {
              if (method === 'POST' && url.includes('/api/videos')) {
                console.log(`📡 Response: { id: "${parsedData?.id}", ... }`)
              }
            }
            
            // Handle different status codes
            if (statusCode >= 200 && statusCode < 300) {
              resolve({
                success: true,
                status: statusCode,
                data: parsedData,
                headers
              })
            } else if (statusCode === 401) {
              // Unauthorized - token might be expired
              authToken = null
              reject({
                success: false,
                status: statusCode,
                error: 'Unauthorized',
                message: 'Authentication required',
                code: 'UNAUTHORIZED'
              })
            } else if (statusCode === 404) {
              reject({
                success: false,
                status: statusCode,
                error: 'Not Found',
                message: parsedData?.message || 'Resource not found',
                code: 'NOT_FOUND'
              })
            } else {
              reject({
                success: false,
                status: statusCode,
                error: parsedData?.error || 'Request failed',
                message: parsedData?.message || `Request failed with status ${statusCode}`,
                code: 'REQUEST_FAILED'
              })
            }
          })
        })
        
        request.on('error', (error) => {
          console.error(`📡 Network error for ${method} ${url}:`, error.message)
          reject({
            success: false,
            error: 'Network Error',
            message: error.message,
            code: 'NETWORK_ERROR'
          })
        })
        
        request.end()
      })
      */
    } catch (error) {
      console.error(`📡 Request error for ${method} ${url}:`, error)
      return {
        success: false,
        error: error.message,
        code: 'REQUEST_ERROR'
      }
    }
  })
  
  // Set auth token handler
  ipcMain.handle('api:setAuthToken', async (event, token) => {
    setAuthToken(token)
    return { success: true }
  })
  
  // Clear auth token handler
  ipcMain.handle('api:clearAuthToken', async () => {
    authToken = null
    return { success: true }
  })
}