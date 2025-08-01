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

### Settings Management

- **All settings should save automatically on change** - No save buttons required
- Settings changes should persist immediately to disk
- Use watchers in Pinia stores to auto-save when values change

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

## API Integration

### API Specification

The complete API specification is documented in [`API_SPEC.md`](./API_SPEC.md). This document defines:
- All REST endpoints (methods, routes, payloads, responses)
- Standard response formats and error codes
- Authentication requirements
- WebSocket events for real-time updates
- Rate limiting guidelines

**Important**: Keep `API_SPEC.md` updated when adding or modifying API calls in the application.

### Video Upload & Metadata Flow

When the web server is implemented, the video upload and encoding flow will work as follows:

1. **Video Creation** - When a user uploads a video:
   ```javascript
   // POST /api/videos
   const response = await api.post('/videos', {
     projectId: currentProject.id,
     name: file.name,
     size: file.size,
     duration: metadata.duration,
     resolution: metadata.resolution
   })
   
   const video = response.data // { id, name, status, createdAt, etc. }
   ```

2. **Metadata Updates** - Users can edit video metadata during upload/encoding:
   ```javascript
   // PATCH /api/videos/:id
   await api.patch(`/videos/${video.id}`, {
     name: newName,
     description: description,
     tags: selectedTags
   })
   ```

3. **Real-time Sync** - Names and metadata will be reactive across all UI components:
   - File Explorer shows the latest name
   - Queue reflects name changes immediately
   - WebSocket or SSE updates for real-time sync

4. **Current Mock Implementation**:
   - Videos use `fs_${jobId}` as temporary IDs
   - Names are stored in file system state and synced via shared store
   - Queue watches for name changes in file system items

## Auto-Focus and Text Selection for New Items

### The Challenge
When creating new folders or projects, we want them to be immediately editable with all text selected so users can just start typing. This is tricky because:

1. **Timing Issues**: The component must be rendered in the DOM before we can focus it
2. **Vue Reactivity**: Setting the edit state too early means the component doesn't exist yet
3. **Server Updates**: When the server responds with a real ID, it can cause re-renders that lose focus

### Solution for Folders
Folders are simpler because they don't involve navigation:
1. Create folder and add to fileSystem array
2. Set `editingItemId` immediately
3. Component's `onMounted` hook checks if `isEditing` is true
4. If editing, it focuses and selects all text using `document.execCommand('selectAll')`

### Solution for Projects
Projects are more complex due to navigation and server ID updates:
1. Create project with temporary ID (`temp_project_123...`)
2. Add to projects array
3. Use `requestAnimationFrame` to set `editingProjectId` after DOM paint
4. Component's `onMounted` hook focuses and selects text
5. When server responds (~100ms later), preserve editing state:
   - Check if currently editing before updating ID
   - Update project ID from temp to server ID
   - If was editing, update `editingProjectId` to new ID
   - Don't navigate until user finishes renaming

### Key Code Patterns

**FileSystemItem.vue / SidebarItem.vue:**
```javascript
// Focus and select on mount if created in editing state
onMounted(async () => {
  if (isEditing.value) {
    await focusAndSelectAll()
  }
})
```

**Project Creation:**
```javascript
// Wait for DOM before setting edit state
await nextTick()
requestAnimationFrame(() => {
  editingProjectId.value = tempId
})
```

**Preserving Edit State During ID Update:**
```javascript
const wasEditing = editingProjectId.value === tempId
projects.value[projectIndex].id = serverProject.id
if (wasEditing) {
  editingProjectId.value = serverProject.id
}
```

### Why This Works
- `onMounted` ensures the DOM element exists
- `requestAnimationFrame` ensures browser has painted
- `document.execCommand('selectAll')` is more reliable than manual selection
- Preserving edit state prevents focus loss during server updates

# Important Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- Only create documentation when explicitly requested