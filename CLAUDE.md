# Framesend App - Project Documentation

## Project Overview

Framesend is an Electron-based video encoding application that provides a modern UI for encoding videos into HLS streaming format with adaptive bitrate support. It features both H.264 and AV1 encoding with customizable quality ladders.

## Tech Stack

- **Frontend**: Vue 3 + Pinia + TailwindCSS
- **Backend**: Electron + Node.js
- **Video Processing**: FFmpeg (bundled) with fluent-ffmpeg wrapper
- **UI Components**: Custom design system with light/dark mode support

## Project Structure

```
framesend-app/
├── src/
│   ├── main/              # Electron main process
│   │   ├── handlers/      # IPC handlers
│   │   ├── packages/      # Core business logic
│   │   └── utils/         # Main process utilities
│   ├── renderer/          # Vue app (renderer process)
│   │   ├── components/    # Reusable Vue components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Pinia stores
│   │   └── styles/        # Global styles
│   └── preload/           # Preload scripts
├── resources/             # App resources (icons, binaries)
└── out/                   # Build output
```

## Core Features

### Video Encoding Pipeline

1. **Input Validation**: Validates video files and extracts metadata
2. **Adaptive Bitrate**: Creates multiple quality renditions
3. **HLS Output**: Generates CMAF-compliant fMP4 segments
4. **Thumbnail Generation**: Creates hero images and storyboard sprites
5. **Progress Tracking**: Real-time encoding progress with stage tracking

### Encoding Configuration

- **Codecs**: H.264 (libx264) and AV1 (libsvtav1)
- **Quality Ladders**: Configurable via JSON settings
- **Bitrate Calculation**: Dynamic based on resolution and BPP (bits per pixel)
- **Aspect Ratio Support**: Maintains original aspect ratios

## Development Guidelines

### Language Preferences

- **NO TypeScript** - Always use JavaScript only
- Never add TypeScript files or convert existing JavaScript to TypeScript

### Code Style

- Use ES6+ features (async/await, destructuring, etc.)
- Follow existing patterns in the codebase
- Keep components small and focused
- Use composition API for Vue components

### Window State Persistence

- The Electron app should remember window position and size between sessions
- State is saved to `window-state.json` in the app data directory

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

## Key Components

### Video Encoding Service

- **Location**: `src/main/packages/video-encoder/`
- **Purpose**: Manages video encoding jobs and FFmpeg processes
- **Key Classes**: `VideoEncodingService`, `VideoJob`, `FluentFFmpegWrapper`

### Upload Page

- **Location**: `src/renderer/src/pages/upload.vue`
- **Purpose**: Main interface for video uploads and encoding queue
- **Features**: Drag & drop, file validation, progress tracking

### Encoding Settings

- **Location**: `~/Library/Application Support/framesend-app/encoding-settings.json`
- **Purpose**: User-configurable encoding ladder
- **Format**: JSON with H.264 and AV1 rung enable/disable

## Error Handling

- All async operations should have proper error handling
- User-facing errors should be informative but not technical
- Log technical details to console for debugging

## Performance Considerations

- FFmpeg processes are managed carefully to avoid resource exhaustion
- Parallel encoding is limited by `RESOURCE_LIMITS`
- Large file operations are streamed when possible

## Security

- File paths are validated before processing
- FFmpeg commands are built programmatically (no shell injection)
- Temporary files are cleaned up after processing

# Important Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- Only create documentation when explicitly requested