export default function registerWindowHandlers(ipcMain, { BrowserWindow }) {
  ipcMain.handle('window:minimize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window.minimize()
  })
  
  ipcMain.handle('window:maximize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window.maximize()
  })
  
  ipcMain.handle('window:close', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window.close()
  })
  
  ipcMain.handle('window:isMaximized', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    return window.isMaximized()
  })
  
  ipcMain.handle('window:setAlwaysOnTop', async (event, flag) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window.setAlwaysOnTop(flag)
  })
}