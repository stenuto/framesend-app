import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export default function registerSettingsHandlers(ipcMain, { app }) {
  const settingsPath = join(app.getPath('userData'), 'settings.json')
  
  // Ensure settings directory exists
  const ensureSettingsDir = async () => {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }
  
  // Default settings structure
  const defaultSettings = {
    general: {
      appearance: 'system'
    },
    encoding: {
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
    },
    ui: {
      viewMode: 'list'
    }
  }
  
  // Load all settings
  ipcMain.handle('settings:load', async () => {
    try {
      await ensureSettingsDir()
      
      if (!existsSync(settingsPath)) {
        // Return default settings if file doesn't exist
        return defaultSettings
      }
      
      const content = await readFile(settingsPath, 'utf8')
      const settings = JSON.parse(content)
      
      // Merge with defaults to ensure all properties exist
      // But preserve any additional properties from the saved settings
      return {
        ...settings,  // Include all saved properties
        general: {
          ...defaultSettings.general,
          ...settings.general
        },
        encoding: {
          ...defaultSettings.encoding,
          ...settings.encoding
        },
        ui: {
          ...defaultSettings.ui,
          ...settings.ui
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      return defaultSettings
    }
  })
  
  // Save all settings
  ipcMain.handle('settings:save', async (event, settings) => {
    try {
      await ensureSettingsDir()
      await writeFile(settingsPath, JSON.stringify(settings, null, 2))
      return { success: true }
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    }
  })
}