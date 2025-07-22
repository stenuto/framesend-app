import { ipcMain, app, BrowserWindow } from 'electron'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const modules = { app, BrowserWindow }

export async function registerHandlers() {
  console.log('=== Starting handler registration ===');
  console.log('import.meta.url:', import.meta.url);
  console.log('import.meta.dirname:', import.meta.dirname);
  const handlersDir = import.meta.url.includes('/out/main/') 
    ? join(import.meta.dirname, '../../src/main/handlers')
    : join(import.meta.dirname, '.');
  console.log('Handlers directory:', handlersDir);

  async function loadHandlersFromDir(dir) {
    console.log('Loading handlers from:', dir);
    const entries = readdirSync(dir)
    console.log('Found entries:', entries);

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        await loadHandlersFromDir(fullPath)
      } else if (entry.endsWith('.handler.js')) {
        console.log(`\n--- Loading handler: ${entry} ---`);
        try {
          const fileUrl = pathToFileURL(fullPath).href
          console.log('Handler file URL:', fileUrl);
          const handler = await import(fileUrl)
          console.log('Handler module loaded, checking for default export...');

          if (typeof handler.default === 'function') {
            console.log('Calling handler registration function...');
            await handler.default(ipcMain, modules)
            console.log(`✓ Successfully registered handlers from: ${entry}`)
          } else {
            console.warn(`✗ Handler ${entry} does not export a default function`)
          }
        } catch (error) {
          console.error(`✗ Failed to load handler ${entry}:`, error)
          console.error('Stack trace:', error.stack)
        }
      }
    }
  }

  await loadHandlersFromDir(handlersDir)
  
  // List all registered IPC handlers
  console.log('\n=== Registered IPC handlers ===');
  // Get all handle and on events
  const handleEvents = ipcMain._invokeHandlers || new Map();
  const onEvents = ipcMain._events || {};
  
  // Log handle events
  console.log('Handle events:');
  for (const [channel] of handleEvents) {
    console.log(`- ${channel}`);
  }
  
  // Log on events
  console.log('\nOn events:');
  Object.keys(onEvents).forEach(channel => {
    if (!channel.startsWith('__')) { // Skip internal events
      console.log(`- ${channel}`);
    }
  });
  console.log('=== Handler registration complete ===\n');
}