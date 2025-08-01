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
      customRungs: [
        {
          id: '360p_default1',
          height: 360,
          quality: 2,
          enabled: true
        },
        {
          id: '720p_default2',
          height: 720,
          quality: 3,
          enabled: true
        },
        {
          id: '1080p_default3',
          height: 1080,
          quality: 3,
          enabled: true
        },
        {
          id: '2160p_default4',
          height: 2160,
          quality: 3,
          enabled: false
        }
      ],
      hardwareAcceleration: {
        enabled: true
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