# Project Preferences

## Language Preferences

- **NO TypeScript** - Always use JavaScript only
- Never add TypeScript files or convert existing JavaScript to TypeScript

## Window State Persistence

- The Electron app should remember window position and size between sessions

## IPC Handler System

### Directory Structure
- All IPC handlers must be placed in `src/main/handlers/`
- Handlers can be organized in subdirectories for grouping (e.g., `handlers/file/`, `handlers/window/`)
- Each handler file should export a function that registers its IPC handlers

### Handler Registration Pattern
- The main process will automatically load and register all handlers from the `handlers` directory
- Each handler file should export a default function that accepts `ipcMain` and `app` (or other Electron modules as needed)
- Handler files should follow the naming convention: `[feature].handler.js`

### Example Handler Structure
```javascript
// src/main/handlers/window/window-state.handler.js
export default function registerWindowHandlers(ipcMain, { app, BrowserWindow }) {
  ipcMain.handle('window:minimize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window.minimize()
  })
  
  ipcMain.handle('window:maximize', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window.maximize()
  })
}
```

### Preload API Pattern
- The preload script exposes handlers through the `window.api` object
- Each handler group gets its own namespace (e.g., `window.api.window`, `window.api.file`)
- Keep the API surface clean and organized

### Usage in Renderer
```javascript
// In Vue components
const result = await window.api.window.minimize()
```

### How to Add New IPC Handlers

1. Create a new handler file in the appropriate subdirectory:
   ```javascript
   // src/main/handlers/window/window.handler.js
   export default function registerWindowHandlers(ipcMain, { BrowserWindow }) {
     ipcMain.handle('window:minimize', async (event) => {
       const window = BrowserWindow.fromWebContents(event.sender)
       window.minimize()
     })
     
     ipcMain.handle('window:maximize', async (event) => {
       const window = BrowserWindow.fromWebContents(event.sender)
       window.maximize()
     })
   }
   ```

2. The handler will be automatically loaded when the app starts

3. Add the corresponding API method in `src/preload/index.js` if not already present:
   ```javascript
   window: {
     minimize: () => ipcRenderer.invoke('window:minimize'),
     maximize: () => ipcRenderer.invoke('window:maximize')
   }
   ```

4. Use in your Vue components:
   ```javascript
   // In any Vue component
   methods: {
     async minimizeWindow() {
       await window.api.window.minimize()
     }
   }
   ```

### Handler Organization Guidelines
- Group related handlers in subdirectories (e.g., `window/`, `file/`, `dialog/`)
- Keep handler files focused on a single feature area
- Use descriptive channel names with namespaces (e.g., `window:minimize`, `file:open`)
- Always handle errors appropriately in your handlers
