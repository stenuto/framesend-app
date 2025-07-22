import { Menu } from 'electron'

export default function registerContextMenuHandlers(ipcMain, { BrowserWindow }) {
  console.log('Registering context menu handlers...')
  console.log('BrowserWindow available:', !!BrowserWindow)
  
  ipcMain.handle('menu:show-context', async (event, template, options = {}) => {
    console.log('menu:show-context called with:', { template, options })
    // Convert template actions to IPC callbacks
    const processedTemplate = template.map(item => {
      if (item.type === 'separator') {
        return item
      }
      
      const processedItem = { ...item }
      
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
        processedItem.submenu = item.submenu.map(subItem => {
          if (subItem.type === 'separator') {
            return subItem
          }
          
          const processedSubItem = { ...subItem }
          if (subItem.action) {
            processedSubItem.click = () => {
              event.sender.send('menu:action', subItem.action, subItem.data)
            }
            delete processedSubItem.action
            delete processedSubItem.data
          }
          return processedSubItem
        })
      }
      
      return processedItem
    })
    
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
  
  console.log('Context menu handler registered successfully')
}