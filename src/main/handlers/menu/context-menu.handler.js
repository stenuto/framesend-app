import { Menu, nativeImage } from 'electron'
import path from 'path'

export default function registerContextMenuHandlers(ipcMain, { BrowserWindow, app }) {
  ipcMain.handle('menu:show-context', async (event, template, options = {}) => {
    
    // Helper function to process icons
    const processIcon = (iconPath) => {
      if (!iconPath) return null
      
      // Resolve icon path relative to app resources
      const resolvedPath = path.isAbsolute(iconPath) 
        ? iconPath 
        : path.join(app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'resources'), iconPath)
      
      try {
        const image = nativeImage.createFromPath(resolvedPath)
        if (!image.isEmpty()) {
          return image
        }
      } catch (error) {
        console.error('Failed to load icon:', iconPath, error)
      }
      return null
    }
    
    // Recursive function to process menu items
    const processMenuItem = (item) => {
      if (item.type === 'separator') {
        return item
      }
      
      const processedItem = { ...item }
      
      // Process icon if provided
      if (item.icon) {
        const icon = processIcon(item.icon)
        if (icon) {
          processedItem.icon = icon
        } else {
          // Remove icon property if processing failed
          delete processedItem.icon
        }
      }
      
      // If there's an action, replace click with IPC callback
      if (item.action) {
        processedItem.click = () => {
          event.sender.send('menu:action', item.action, item.data)
        }
        delete processedItem.action
        delete processedItem.data
      }
      
      // Process submenus recursively
      if (item.submenu) {
        processedItem.submenu = item.submenu.map(processMenuItem)
      }
      
      return processedItem
    }
    
    // Convert template actions to IPC callbacks
    const processedTemplate = template.map(processMenuItem)
    
    const menu = Menu.buildFromTemplate(processedTemplate)
    const window = BrowserWindow.fromWebContents(event.sender)
    
    menu.popup({
      window,
      x: options.x,
      y: options.y,
      positioningItem: options.positioningItem,
      callback: options.callback
    })
  })
}