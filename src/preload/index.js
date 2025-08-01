import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    setAlwaysOnTop: (flag) => ipcRenderer.invoke('window:setAlwaysOnTop', flag)
  },
  
  // File operations
  file: {
    open: (options) => ipcRenderer.invoke('file:open', options),
    save: (options) => ipcRenderer.invoke('file:save', options),
    readFile: (path) => ipcRenderer.invoke('file:read', path),
    writeFile: (path, data) => ipcRenderer.invoke('file:write', path, data),
    saveTemp: (name, buffer) => ipcRenderer.invoke('file:saveTemp', { name, buffer }),
    cleanTemp: (path) => ipcRenderer.invoke('file:cleanTemp', path),
    readImage: (path) => ipcRenderer.invoke('file:readImage', path)
  },
  
  // Dialog operations
  dialog: {
    showMessage: (options) => ipcRenderer.invoke('dialog:showMessage', options),
    showError: (title, content) => ipcRenderer.invoke('dialog:showError', title, content),
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options)
  },
  
  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform')
  },
  
  // Video encoding
  video: {
    validate: (filePath) => ipcRenderer.invoke('video:validate', filePath),
    validateBatch: (filePaths) => ipcRenderer.invoke('video:validateBatch', filePaths),
    encode: (filePath, options) => ipcRenderer.invoke('video:encode', { filePath, options }),
    cancel: (jobId) => ipcRenderer.invoke('video:cancel', jobId),
    forceKill: (jobId) => ipcRenderer.invoke('video:forceKill', jobId),
    emergencyStop: () => ipcRenderer.invoke('video:emergencyStop'),
    processStatus: () => ipcRenderer.invoke('video:processStatus'),
    testKill: () => ipcRenderer.invoke('video:testKill'),
    getStatus: () => ipcRenderer.invoke('video:status'),
    pause: () => ipcRenderer.invoke('video:pause'),
    resume: () => ipcRenderer.invoke('video:resume'),
    selectFiles: () => ipcRenderer.invoke('video:selectFiles'),
    // Thumbnail operations
    uploadThumbnail: (videoId) => ipcRenderer.invoke('video:uploadThumbnail', { videoId }),
    setFrameAsThumbnail: (videoId, timestamp) => ipcRenderer.invoke('video:setFrameAsThumbnail', { videoId, timestamp }),
    copyFrameToClipboard: (videoId, timestamp) => ipcRenderer.invoke('video:copyFrameToClipboard', { videoId, timestamp }),
    
    // Event listeners
    onStart: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('encoding:start', listener);
      return () => ipcRenderer.removeListener('encoding:start', listener);
    },
    onProgress: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('encoding:progress', listener);
      return () => ipcRenderer.removeListener('encoding:progress', listener);
    },
    onComplete: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('encoding:complete', listener);
      return () => ipcRenderer.removeListener('encoding:complete', listener);
    },
    onError: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('encoding:error', listener);
      return () => ipcRenderer.removeListener('encoding:error', listener);
    },
    onCancelled: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('encoding:cancelled', listener);
      return () => ipcRenderer.removeListener('encoding:cancelled', listener);
    },
    onThumbnail: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('encoding:thumbnail', listener);
      return () => ipcRenderer.removeListener('encoding:thumbnail', listener);
    }
  },
  
  // Settings operations
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings)
  },
  
  // Context menu operations
  menu: {
    showContext: (template, options) => ipcRenderer.invoke('menu:show-context', template, options),
    onAction: (callback) => {
      const listener = (event, action, data) => callback(action, data)
      ipcRenderer.on('menu:action', listener)
      return () => ipcRenderer.removeListener('menu:action', listener)
    },
    updateViewMode: (mode) => ipcRenderer.send('menu:updateViewMode', mode)
  },
  
  // API operations
  request: (method, url, data, headers) => 
    ipcRenderer.invoke('api:request', { method, url, data, headers }),
  setAuthToken: (token) => ipcRenderer.invoke('api:setAuthToken', token),
  clearAuthToken: () => ipcRenderer.invoke('api:clearAuthToken'),
  
  // Keybindings operations
  keybindings: {
    registerAll: (shortcuts) => ipcRenderer.invoke('keybindings:registerAll', shortcuts),
    load: () => ipcRenderer.invoke('keybindings:load'),
    save: (shortcuts) => ipcRenderer.invoke('keybindings:save', shortcuts)
  }
}

// IPC bridge for renderer
const ipc = {
  send: (channel, payload) => ipcRenderer.send(channel, payload),
  on: (channel, callback) => {
    const listener = (event, ...args) => callback(...args)
    ipcRenderer.on(channel, listener)
    // Return cleanup function
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

// Extend electronAPI with webUtils
const extendedElectronAPI = {
  ...electronAPI,
  webUtils: {
    getPathForFile: (file) => webUtils.getPathForFile(file)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', extendedElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('ipc', ipc)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = extendedElectronAPI
  window.api = api
  window.ipc = ipc
}
