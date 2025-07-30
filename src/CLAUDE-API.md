# Web Server API Communication

## Overview

Framesend communicates with a web server for data persistence and team collaboration. All API calls are logged in the main process console with a 📡 emoji for easy tracking.

**Authentication**: Future implementation will use JWT tokens via Clerk. For now, API calls are prepared with auth headers but no actual authentication.

## API Endpoints

### Projects
```
GET    /api/projects              # Get all projects
GET    /api/projects/:id          # Get single project
POST   /api/projects              # Create project
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
GET    /api/projects/:id/content  # Get project folders & videos
```

### Videos
```
POST   /api/videos                # Create video (status: queued)
GET    /api/videos/:id            # Get video details
PUT    /api/videos/:id            # Update video (status, metadata)
DELETE /api/videos/:id            # Delete video
```

### Folders
```
POST   /api/projects/:id/folders  # Create folder in project
PUT    /api/folders/:id           # Update folder (name, parent)
DELETE /api/folders/:id           # Delete folder
```

## App Initialization Flow

When the app starts:

1. **Load all projects**
   ```
   📡 GET /api/projects
   Response: [{ id, name, videoCount, lastModified, color }, ...]
   ```

2. **Select first project and load content**
   ```
   📡 GET /api/projects/{projectId}/content
   Response: { 
     folders: [{ id, name, parentId, orderIndex }, ...],
     videos: [{ id, name, folderId, status, duration, size }, ...]
   }
   ```

## Video Encoding Flow

1. **Queue video for encoding**
   ```
   📡 POST /api/videos
   Body: { projectId, name, status: "queued" }
   Response: { id: "video-123", ... }
   ```

2. **Update status to processing**
   ```
   📡 PUT /api/videos/{videoId}
   Body: { status: "processing" }
   ```

3. **Update status on completion**
   ```
   📡 PUT /api/videos/{videoId}
   Body: { status: "ready", metadata: { duration, renditions, outputPath } }
   ```

4. **Update status on failure**
   ```
   📡 PUT /api/videos/{videoId}
   Body: { status: "failed", error: "Error message" }
   ```

## Console Output Example

```
📡 GET /api/projects
📡 GET /api/projects/proj1/content
📡 POST /api/videos { projectId: "proj1", name: "video.mp4", status: "queued" }
📡 Response: { id: "7DxnIWQKnP6EiIeMNHZZM", ... }
📡 PUT /api/videos/7DxnIWQKnP6EiIeMNHZZM { status: "processing" }
📡 PUT /api/videos/7DxnIWQKnP6EiIeMNHZZM { status: "ready", metadata: {...} }
```

## Error Handling

- **Network errors**: App continues with local data (offline mode)
- **401 Unauthorized**: Future - trigger re-authentication
- **404 Not Found**: Remove item from local store
- **500 Server Error**: Show user-friendly error message

## Data Flow

1. **Server → Store**: API responses hydrate Pinia stores
2. **Store → UI**: Vue components react to store changes
3. **UI → Store**: User actions update store optimistically
4. **Store → Server**: Changes sync to server (with rollback on error)

## Future Considerations

- **JWT Authentication**: Bearer token in Authorization header
- **WebSocket**: Real-time updates for collaborative editing
- **Pagination**: For large project lists
- **Caching**: ETags for efficient data fetching