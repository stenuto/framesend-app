import { ipcMain, app, BrowserWindow } from 'electron'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const modules = { app, BrowserWindow }

export async function registerHandlers() {
  const handlersDir = join(import.meta.dirname, '.')

  async function loadHandlersFromDir(dir) {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        await loadHandlersFromDir(fullPath)
      } else if (entry.endsWith('.handler.js')) {
        try {
          const fileUrl = pathToFileURL(fullPath).href
          const handler = await import(fileUrl)

          if (typeof handler.default === 'function') {
            handler.default(ipcMain, modules)
            console.log(`Registered handlers from: ${entry}`)
          } else {
            console.warn(`Handler ${entry} does not export a default function`)
          }
        } catch (error) {
          console.error(`Failed to load handler ${entry}:`, error)
        }
      }
    }
  }

  await loadHandlersFromDir(handlersDir)
}