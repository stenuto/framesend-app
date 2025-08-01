import { globalShortcut, app, BrowserWindow } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'

export default function registerKeybindingsHandler(ipcMain) {
  // Get path for storing keybindings
  const userDataPath = app.getPath('userData')
  const keybindingsPath = join(userDataPath, 'keybindings.json')
  
  // Ensure directory exists
  const ensureDir = () => {
    const dir = userDataPath
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  // Maps to track registered shortcuts
  const registeredGlobal = new Map() // id -> accelerator
  const registeredWindow = new Map() // id -> { accelerator, scope }
  let windowShortcutHandler = null

  // Load saved keybindings
  ipcMain.handle('keybindings:load', async () => {
    try {
      ensureDir()
      
      if (!existsSync(keybindingsPath)) {
        return null // Will use defaults
      }
      
      const content = await readFile(keybindingsPath, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to load keybindings:', error)
      return null
    }
  })

  // Save keybindings
  ipcMain.handle('keybindings:save', async (event, shortcuts) => {
    try {
      ensureDir()
      await writeFile(keybindingsPath, JSON.stringify(shortcuts, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Failed to save keybindings:', error)
      return { success: false, error: error.message }
    }
  })

  // Register all keybindings
  ipcMain.handle('keybindings:registerAll', async (event, shortcuts) => {
    try {
      // First unregister all existing shortcuts
      unregisterAll()

      // Track errors
      const errors = []

      // Register each shortcut
      for (const shortcut of shortcuts) {
        try {
          if (shortcut.scope === 'global') {
            // Register global shortcut
            const success = globalShortcut.register(shortcut.accelerator, () => {
              // Send event to all windows
              BrowserWindow.getAllWindows().forEach(window => {
                window.webContents.send(`keybinding:${shortcut.id}`)
              })
            })

            if (success) {
              registeredGlobal.set(shortcut.id, shortcut.accelerator)
            } else {
              errors.push({
                id: shortcut.id,
                error: 'Failed to register global shortcut'
              })
            }
          } else {
            // Track window-scoped shortcuts
            registeredWindow.set(shortcut.id, {
              accelerator: shortcut.accelerator,
              scope: shortcut.scope
            })
          }
        } catch (error) {
          errors.push({
            id: shortcut.id,
            error: error.message
          })
        }
      }

      // Set up window-local shortcut handler if needed
      if (registeredWindow.size > 0) {
        setupWindowShortcutHandler()
      }

      // Send any errors back to renderer
      if (errors.length > 0) {
        event.sender.send('keybindings:error', errors)
      }

      return { success: true, errors }
    } catch (error) {
      console.error('Failed to register keybindings:', error)
      return { success: false, error: error.message }
    }
  })

  // Set up window-local shortcut handler
  function setupWindowShortcutHandler() {
    // Remove existing handler
    if (windowShortcutHandler && windowShortcutHandler.cleanup) {
      windowShortcutHandler.cleanup()
    }

    // Create handler factory that captures the webContents
    const createHandler = (webContents) => {
      return (event, input) => {
        // Build accelerator string from input
        const accelerator = buildAccelerator(input)
        
        // Check if it matches any window-scoped shortcuts
        for (const [id, shortcut] of registeredWindow) {
          if (normalizeAccelerator(shortcut.accelerator) === normalizeAccelerator(accelerator)) {
            event.preventDefault()
            
            // Send event to the window
            webContents.send(`keybinding:${id}`)
            break
          }
        }
      }
    }

    // Store handlers per window to allow proper cleanup
    const windowHandlers = new WeakMap()

    // Attach to all existing windows
    BrowserWindow.getAllWindows().forEach(window => {
      const handler = createHandler(window.webContents)
      windowHandlers.set(window, handler)
      window.webContents.on('before-input-event', handler)
    })

    // Attach to new windows
    app.on('browser-window-created', (event, window) => {
      const handler = createHandler(window.webContents)
      windowHandlers.set(window, handler)
      window.webContents.on('before-input-event', handler)
    })

    // Update cleanup function
    windowShortcutHandler = {
      handlers: windowHandlers,
      cleanup: () => {
        BrowserWindow.getAllWindows().forEach(window => {
          const handler = windowHandlers.get(window)
          if (handler) {
            window.webContents.off('before-input-event', handler)
          }
        })
      }
    }
  }

  // Build accelerator string from input event
  function buildAccelerator(input) {
    const parts = []
    
    if (input.control) parts.push('Ctrl')
    if (input.alt) parts.push('Alt')
    if (input.shift) parts.push('Shift')
    if (input.meta) parts.push(process.platform === 'darwin' ? 'Cmd' : 'Super')
    
    // Map key names
    let key = input.key
    const keyMap = {
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Enter': 'Enter',
      'Escape': 'Escape',
      ' ': 'Space',
      'Tab': 'Tab',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5',
      'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10',
      'F11': 'F11', 'F12': 'F12'
    }
    
    if (keyMap[key]) {
      key = keyMap[key]
    } else if (key.length === 1) {
      key = key.toUpperCase()
    }
    
    parts.push(key)
    
    return parts.join('+')
  }

  // Normalize accelerator for comparison
  function normalizeAccelerator(accelerator) {
    return accelerator
      .replace(/CmdOrCtrl/g, process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
      .replace(/Cmd/g, 'Meta')
      .replace(/CommandOrControl/g, process.platform === 'darwin' ? 'Meta' : 'Ctrl')
      .replace(/Command/g, 'Meta')
      .replace(/Control/g, 'Ctrl')
      .replace(/Option/g, 'Alt')
      .toLowerCase()
      .split('+')
      .map(s => s.trim())
      .sort()
      .join('+')
  }

  // Unregister all shortcuts
  function unregisterAll() {
    // Unregister global shortcuts
    for (const [id, accelerator] of registeredGlobal) {
      try {
        globalShortcut.unregister(accelerator)
      } catch (error) {
        console.error(`Failed to unregister global shortcut ${id}:`, error)
      }
    }
    registeredGlobal.clear()

    // Clear window shortcuts
    registeredWindow.clear()

    // Remove window handler
    if (windowShortcutHandler && windowShortcutHandler.cleanup) {
      windowShortcutHandler.cleanup()
      windowShortcutHandler = null
    }
  }

  // Get platform
  ipcMain.handle('app:getPlatform', () => {
    return process.platform
  })

  // Clean up on app quit
  app.on('will-quit', () => {
    unregisterAll()
  })
}