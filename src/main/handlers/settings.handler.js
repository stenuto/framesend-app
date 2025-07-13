import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export default function registerSettingsHandlers(ipcMain, { app }) {
  console.log('Registering settings handlers...')
  const settingsPath = join(app.getPath('userData'), 'encoding-settings.json')
  console.log('Settings path:', settingsPath)
  
  // Ensure settings directory exists
  const ensureSettingsDir = async () => {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }
  
  ipcMain.handle('settings:load', async () => {
    console.log('settings:load called')
    try {
      await ensureSettingsDir()
      
      if (!existsSync(settingsPath)) {
        // Return default settings if file doesn't exist
        return {
          h264: {
            enabled: true,
            rungs: {
              '360p': true,
              '720p': true,
              '1080p': true,
              '2160p': true
            },
            quality: 3
          },
          av1: {
            enabled: false,
            rungs: {
              '2160p_hq': true
            },
            quality: 5
          }
        }
      }
      
      const content = await readFile(settingsPath, 'utf8')
      const settings = JSON.parse(content)
      
      // Ensure quality properties exist for backward compatibility
      if (settings.h264 && (!settings.h264.quality || typeof settings.h264.quality === 'object')) {
        settings.h264.quality = 3
      }
      
      if (settings.av1 && (!settings.av1.quality || typeof settings.av1.quality === 'object')) {
        settings.av1.quality = 5
      }
      
      return settings
    } catch (error) {
      console.error('Failed to load settings:', error)
      throw error
    }
  })
  
  ipcMain.handle('settings:save', async (event, settings) => {
    console.log('settings:save called with:', settings)
    try {
      await ensureSettingsDir()
      await writeFile(settingsPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  })
  
  console.log('Settings handlers registered successfully')
}