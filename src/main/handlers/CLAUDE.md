# IPC Handlers Documentation

## Overview

IPC handlers provide the bridge between the renderer process (UI) and main process functionality. They handle all system-level operations that require Node.js or Electron APIs.

## Handler Structure

Each handler is a module that exports a registration function:

```javascript
export default function registerHandlers(ipcMain, { app, BrowserWindow, dialog }) {
  // Register handlers here
}
```

## Current Handlers

### video-encoding.handler.js

Manages all video encoding operations.

**Channels:**
- `video:validate` - Validate video file
- `video:encode` - Start encoding job
- `video:cancel` - Cancel active job
- `video:status` - Get queue status
- `video:pause` - Pause encoding queue
- `video:resume` - Resume encoding queue
- `video:selectFiles` - Open file dialog
- `video:forceKill` - Force kill FFmpeg processes
- `video:emergencyStop` - Stop all encoding
- `video:processStatus` - Get process information

**Key Features:**
- Singleton service management
- Event forwarding to renderer
- Process cleanup on app quit
- Error handling and recovery

**Example:**
```javascript
ipcMain.handle('video:encode', async (event, { filePath, options }) => {
  try {
    const service = await getEncodingService();
    const job = await service.queueVideo(filePath, options);
    
    // Set up event forwarding
    service.on('job:progress', (progress) => {
      if (progress.jobId === job.id) {
        event.sender.send('encoding:progress', progress);
      }
    });
    
    return {
      success: true,
      data: { id: job.id, filePath }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});
```

### file-dialog.handler.js

Handles file dialog operations.

**Channels:**
- `dialog:showOpenDialog` - Show open file dialog
- `dialog:showSaveDialog` - Show save file dialog
- `dialog:showMessage` - Show message box
- `dialog:showError` - Show error dialog

**Features:**
- Native file dialogs
- Multiple file selection
- File type filtering
- Custom dialog options

### file-temp.handler.js

Manages temporary file operations.

**Channels:**
- `file:saveTemp` - Save buffer to temp file
- `file:cleanTemp` - Clean up temp file
- `file:read` - Read file contents
- `file:write` - Write file contents

**Features:**
- Automatic temp directory management
- Buffer to file conversion
- Cleanup on app quit

### Window State Handler (TODO)

Will manage window state persistence.

**Planned Channels:**
- `window:minimize` - Minimize window
- `window:maximize` - Maximize window
- `window:close` - Close window
- `window:isMaximized` - Check maximized state
- `window:setAlwaysOnTop` - Set always on top

## Event System

### Event Forwarding Pattern

Main process events are forwarded to specific renderer instances:

```javascript
// In handler
const progressHandler = (data) => {
  if (data.jobId === job.id) {
    event.sender.send('encoding:progress', data);
  }
};

service.on('job:progress', progressHandler);

// Cleanup when done
service.off('job:progress', progressHandler);
```

### Event Channels

**Encoding Events:**
- `encoding:start` - Job started
- `encoding:progress` - Progress update
- `encoding:complete` - Job completed
- `encoding:error` - Job failed
- `encoding:cancelled` - Job cancelled

## Error Handling

### Standard Response Format

All handlers return a consistent response format:

```javascript
// Success
{
  success: true,
  data: { /* response data */ }
}

// Error
{
  success: false,
  error: "Error message"
}
```

### Error Handling Pattern

```javascript
ipcMain.handle('channel:name', async (event, params) => {
  try {
    // Validate inputs
    if (!params.required) {
      throw new Error('Missing required parameter');
    }
    
    // Perform operation
    const result = await riskyOperation(params);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[channel:name] Error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
});
```

## Security Considerations

### Path Validation

Always validate file paths:

```javascript
// Validate file exists
if (!fs.existsSync(filePath)) {
  throw new Error('File not found');
}

// Validate file type
const ext = path.extname(filePath).toLowerCase();
if (!ALLOWED_EXTENSIONS.includes(ext)) {
  throw new Error('Invalid file type');
}
```

### Input Sanitization

Sanitize all inputs from renderer:

```javascript
// Sanitize strings
const sanitized = String(input).trim();

// Validate numbers
const num = Number(input);
if (isNaN(num) || num < 0) {
  throw new Error('Invalid number');
}
```

## Resource Management

### Singleton Services

Services are created once and reused:

```javascript
let service = null;

async function getService() {
  if (!service) {
    service = new Service(config);
    await service.initialize();
  }
  return service;
}
```

### Cleanup

Always clean up resources:

```javascript
// On app quit
app.on('before-quit', async () => {
  // Stop all operations
  if (service) {
    await service.cleanup();
  }
  
  // Kill any remaining processes
  await killAllProcesses();
});
```

## Best Practices

1. **Validate all inputs** from renderer process
2. **Use consistent response format** for all handlers
3. **Log errors with context** for debugging
4. **Clean up event listeners** to prevent memory leaks
5. **Handle edge cases** gracefully
6. **Keep handlers focused** on single responsibility
7. **Document channel parameters** clearly
8. **Test error scenarios** thoroughly

## Adding New Handlers

1. Create new handler file following naming convention
2. Export default registration function
3. Register channels with descriptive names
4. Add corresponding preload API methods
5. Document channels and parameters
6. Test error cases and edge cases

## Performance Tips

- Use `ipcMain.handle` for async operations
- Batch multiple operations when possible
- Avoid blocking the main thread
- Stream large files instead of loading to memory
- Cache expensive operations
- Use worker threads for CPU-intensive tasks