import { Menu, app, BrowserWindow } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export default function registerApplicationMenuHandler(ipcMain) {
  const isMac = process.platform === 'darwin'

  const template = [
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
          checked: false, // Will be updated dynamically
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
          checked: false, // Will be updated dynamically
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

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Function to update view mode in menu
  const updateViewMode = (viewMode) => {
    const viewMenu = menu.items.find(item => item.label === 'View')
    if (viewMenu && viewMenu.submenu) {
      const listItem = viewMenu.submenu.items[0]
      const galleryItem = viewMenu.submenu.items[1]
      
      if (viewMode === 'list') {
        listItem.checked = true
        galleryItem.checked = false
      } else if (viewMode === 'gallery') {
        listItem.checked = false
        galleryItem.checked = true
      }
    }
  }

  // Listen for view mode changes from renderer
  ipcMain.on('menu:updateViewMode', (event, viewMode) => {
    updateViewMode(viewMode)
  })

  // Request initial view mode when window is ready
  ipcMain.on('menu:requestViewMode', (event) => {
    event.sender.send('menu:getViewMode')
  })
  
  // Load view mode from settings on startup
  const loadInitialViewMode = async () => {
    try {
      const settingsPath = join(app.getPath('userData'), 'settings.json')
      if (existsSync(settingsPath)) {
        const content = await readFile(settingsPath, 'utf8')
        const settings = JSON.parse(content)
        const viewMode = settings.ui?.viewMode || 'list'
        updateViewMode(viewMode)
      } else {
        // Default to list view if no settings exist
        updateViewMode('list')
      }
    } catch (error) {
      console.error('Failed to load view mode from settings:', error)
      updateViewMode('list')
    }
  }
  
  // Load initial view mode
  loadInitialViewMode()
}