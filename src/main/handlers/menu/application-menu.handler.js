import { Menu, app, BrowserWindow } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export default function registerApplicationMenuHandler(ipcMain) {
  const isMac = process.platform === 'darwin'
  
  // Store current view mode
  let currentViewMode = 'list' // Default to list
  
  // Function to build menu template with current view mode
  const buildMenuTemplate = () => [
    // App Menu (macOS only)
    ...(isMac
      ? [{
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services', submenu: [] },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }]
      : []),
    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('menu:action', 'file:newProject')
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }]
              }
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }])
      ]
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'as List',
          type: 'radio',
          checked: currentViewMode === 'list',
          id: 'view-list',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('menu:action', 'explorer:viewList')
            }
          }
        },
        {
          label: 'as Gallery',
          type: 'radio',
          checked: currentViewMode === 'gallery',
          id: 'view-gallery',
          click: () => {
            const window = BrowserWindow.getFocusedWindow()
            if (window) {
              window.webContents.send('menu:action', 'explorer:viewGallery')
            }
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' }
            ]
          : [])
      ]
    },
    // Help Menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ]

  // Build initial menu
  let menu = Menu.buildFromTemplate(buildMenuTemplate())
  Menu.setApplicationMenu(menu)

  // Function to update view mode in menu by rebuilding it
  const updateViewMode = (viewMode) => {
    console.log(`[Menu] Updating view mode from ${currentViewMode} to ${viewMode}`)
    currentViewMode = viewMode
    
    // Rebuild the entire menu with the new view mode
    menu = Menu.buildFromTemplate(buildMenuTemplate())
    Menu.setApplicationMenu(menu)
    
    console.log('[Menu] Menu rebuilt with view mode:', viewMode)
  }

  // Listen for view mode changes from renderer
  ipcMain.on('menu:updateViewMode', (event, viewMode) => {
    console.log('[Menu] Updating view mode to:', viewMode)
    updateViewMode(viewMode)
  })

  // Request initial view mode when window is ready
  ipcMain.on('menu:requestViewMode', (event) => {
    event.sender.send('menu:getViewMode')
  })
  
  // Set up window event handlers for menu synchronization
  const setupWindowHandlers = (window) => {
    // When window is ready, request the current view mode
    window.webContents.once('did-finish-load', () => {
      console.log('[Menu] Window loaded, requesting view mode')
      window.webContents.send('menu:getViewMode')
    })
    
    // Also sync when window gains focus
    window.on('focus', () => {
      window.webContents.send('menu:getViewMode')
    })
  }
  
  // Set up handlers for existing windows
  BrowserWindow.getAllWindows().forEach(setupWindowHandlers)
  
  // Set up handlers for new windows
  app.on('browser-window-created', (event, window) => {
    setupWindowHandlers(window)
  })
  
  // Note: We don't load initial view mode from settings here anymore
  // The renderer will send us the correct view mode when it's ready
}