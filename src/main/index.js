import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import path from 'path'
import { registerHandlers } from './handlers/index.js'

// Get the path for storing window state
const getWindowStatePath = () => {
  return path.join(app.getPath('userData'), 'window-state.json')
}

// Load window state from file
const loadWindowState = () => {
  try {
    const stateFile = getWindowStatePath()
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'))
    }
  } catch (error) {
    console.log('Could not load window state:', error)
  }
  return null
}

// Save window state to file
const saveWindowState = (windowState) => {
  try {
    const stateFile = getWindowStatePath()
    fs.writeFileSync(stateFile, JSON.stringify(windowState))
  } catch (error) {
    console.log('Could not save window state:', error)
  }
}

// Ensure window is visible on screen
const ensureVisibleOnSomeDisplay = (windowState) => {
  const visible = screen.getAllDisplays().some((display) => {
    return (
      windowState.x >= display.bounds.x &&
      windowState.y >= display.bounds.y &&
      windowState.x + windowState.width <= display.bounds.x + display.bounds.width &&
      windowState.y + windowState.height <= display.bounds.y + display.bounds.height
    )
  })
  return visible
}

function createWindow() {
  // Fixed window size
  const windowWidth = 480
  const windowHeight = 700

  let windowOptions = {
    width: windowWidth,
    height: windowHeight,
    minWidth: windowWidth, // Set minimum width
    minHeight: windowHeight, // Set minimum height
    show: false,
    resizable: true, // Enable resizing
    maximizable: true, // Enable maximize button
    fullscreenable: true, // Enable fullscreen
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000', // Fully transparent
    vibrancy: 'under-window', // macOS only - adds blur effect
    visualEffectState: 'active', // macOS only
    titleBarStyle: 'hiddenInset', // macOS - hides title bar but shows traffic lights
    trafficLightPosition: { x: 10, y: 9 }, // Adjust traffic light position
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  }

  // Restore window state
  const savedState = loadWindowState()
  if (savedState) {
    // Restore size if valid (respecting minimum size)
    if (savedState.width && savedState.height) {
      windowOptions.width = Math.max(savedState.width, windowWidth)
      windowOptions.height = Math.max(savedState.height, windowHeight)
    }
    
    // Restore position
    if (savedState.x !== undefined && savedState.y !== undefined) {
      if (ensureVisibleOnSomeDisplay(savedState)) {
        windowOptions.x = savedState.x
        windowOptions.y = savedState.y
      }
    }
    
    // Handle maximized state
    if (savedState.isMaximized) {
      windowOptions.show = false
    }
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow(windowOptions)

  // Restore maximized state if needed
  if (savedState && savedState.isMaximized) {
    mainWindow.maximize()
  }

  // Track window state changes
  let windowState = {
    isMaximized: mainWindow.isMaximized(),
    ...mainWindow.getBounds()
  }

  // Save state when window is moved or resized
  const saveState = () => {
    if (!mainWindow.isMaximized()) {
      windowState = {
        ...mainWindow.getBounds(),
        isMaximized: false
      }
    } else {
      windowState.isMaximized = true
    }
  }

  mainWindow.on('resize', saveState)
  mainWindow.on('move', saveState)
  mainWindow.on('maximize', () => {
    windowState.isMaximized = true
  })
  mainWindow.on('unmaximize', () => {
    windowState.isMaximized = false
    saveState()
  })

  // Save state when window is closed
  mainWindow.on('close', () => {
    saveWindowState(windowState)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register all IPC handlers
  await registerHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
