import { app } from 'electron'

export default function registerAppHandlers(ipcMain) {
  ipcMain.handle('app:getPath', async (event, name) => {
    return app.getPath(name)
  })
}