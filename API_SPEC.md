# Framesend API Specification

## Overview

This document defines all API endpoints used by the Framesend application. All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: `/api`  
**Authentication**: Bearer token in Authorization header  
**Content-Type**: `application/json`

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE" // optional
}
```

**HTTP Status Codes**:
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid auth token
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., folder not empty)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Common Types

### Timestamps
All timestamps are ISO 8601 strings in UTC:
```
"2024-01-15T10:30:00.000Z"
```

### IDs
- **Projects, Folders, Jobs**: UUID v4 format
  ```
  "123e4567-e89b-12d3-a456-426614174000"
  ```
- **Videos**: 8-character nanoID
  ```
  "A1b2C3d4"
  ```

---

## Projects

### List Projects
**GET** `/api/projects`

Get all projects for the authenticated user.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "proj_123",
      "name": "Marketing Campaign 2024",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "totalSize": 1073741824 // bytes
    }
  ]
}
```

### Get Project
**GET** `/api/projects/:id`

Get a single project by ID.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "Marketing Campaign 2024",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "totalSize": 1073741824
  }
}
```

### Create Project
**POST** `/api/projects`

Create a new project.

#### Request Body
```json
{
  "name": "New Project"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "proj_new_123",
    "name": "New Project",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "totalSize": 0
  }
}
```

### Update Project
**PUT** `/api/projects/:id`

Update project details.

#### Request Body
```json
{
  "name": "Updated Project Name"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "Updated Project Name",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T10:30:00.000Z",
    "totalSize": 1073741824
  }
}
```

### Delete Project
**DELETE** `/api/projects/:id`

Delete a project and all its contents.

#### Response
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### Get Project Content
**GET** `/api/projects/:id/content`

Get all folders and videos in a project.

#### Response
```json
{
  "success": true,
  "data": {
    "folders": [
      {
        "id": "folder_123",
        "name": "Product Videos",
        "parentId": null,
        "projectId": "proj_123",
        "orderIndex": 0,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "videos": [
      {
        "id": "A1b2C3d4",
        "name": "hero-video.mp4",
        "parentId": "folder_123",
        "projectId": "proj_123",
        "orderIndex": 0,
        "status": "ready", // queued | processing | ready | failed
        "progress": 100,
        "duration": 120, // seconds
        "originalSize": 52428800, // original file size in bytes
        "encodedSize": 15728640, // encoded size in bytes (0 if not ready)
        "resolution": "1920x1080",
        "encodingJobId": "123e4567-e89b-12d3-a456-426614174000",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Folders

### List Folders
**GET** `/api/projects/:id/folders`

Get all folders in a project.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "folder_123",
      "name": "Marketing Assets",
      "parentId": null,
      "projectId": "proj_123",
      "orderIndex": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "folder_456",
      "name": "Product Videos",
      "parentId": "folder_123",
      "projectId": "proj_123",
      "orderIndex": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Folder
**POST** `/api/projects/:id/folders`

Create a new folder in the specified project.

#### Request Body
```json
{
  "name": "New Folder",
  "parentId": "folder_parent_123", // null for root
  "orderIndex": 0
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "folder_new_123",
    "name": "New Folder",
    "parentId": "folder_parent_123",
    "projectId": "proj_123",
    "orderIndex": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Folder
**PUT** `/api/folders/:id`

Update folder details or move to different parent.

#### Request Body
```json
{
  "name": "Renamed Folder",
  "parentId": "folder_new_parent", // optional, to move folder
  "orderIndex": 1 // optional, to reorder
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "folder_123",
    "name": "Renamed Folder",
    "parentId": "folder_new_parent",
    "projectId": "proj_123",
    "orderIndex": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T10:30:00.000Z"
  }
}
```

### Delete Folder
**DELETE** `/api/folders/:id`

Delete an empty folder.

#### Response
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

#### Error Response (if not empty)
```json
// 409 Conflict
{
  "success": false,
  "error": "Folder is not empty",
  "code": "FOLDER_NOT_EMPTY"
}
```

---

## Videos

### Create Video
**POST** `/api/videos`

Register a new video (typically after upload/encoding starts).

#### Request Body
```json
{
  "name": "product-demo.mp4",
  "parentId": "folder_123", // null for root
  "projectId": "proj_123",
  "orderIndex": 0,
  "encodingJobId": "234e5678-f89c-23e4-b567-537725285111",
  "originalSize": 52428800, // original file size in bytes
  "duration": 120, // seconds
  "resolution": "1920x1080"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "B2c3D4e5",
    "name": "product-demo.mp4",
    "parentId": "folder_123",
    "projectId": "proj_123",
    "orderIndex": 0,
    "status": "queued",
    "progress": 0,
    "encodingJobId": "234e5678-f89c-23e4-b567-537725285111",
    "originalSize": 52428800,
    "encodedSize": 0, // will be updated during/after encoding
    "duration": 120,
    "resolution": "1920x1080",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Video
**GET** `/api/videos/:id`

Get video details including encoding status.

#### Response
```json
{
  "success": true,
  "data": {
    "id": "A1b2C3d4",
    "name": "product-demo.mp4",
    "parentId": "folder_123",
    "projectId": "proj_123",
    "orderIndex": 0,
    "status": "ready",
    "progress": 100,
    "encodingJobId": "234e5678-f89c-23e4-b567-537725285111",
    "originalSize": 52428800, // original file size in bytes
    "encodedSize": 15728640, // encoded size (all HLS files, thumbnails, etc.)
    "duration": 120,
    "resolution": "1920x1080",
    "streamingUrl": "https://cdn.framesend.com/A1b2C3d4/master.m3u8",
    "thumbnailUrl": "https://cdn.framesend.com/A1b2C3d4/thumbnail.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Video
**PUT** `/api/videos/:id`

Update video metadata, status, or move to different folder.

#### Request Body (for metadata update)
```json
{
  "name": "renamed-video.mp4",
  "parentId": "folder_new_123", // optional, to move
  "orderIndex": 2 // optional, to reorder
}
```

#### Request Body (for status update)
```json
{
  "status": "processing", // queued | processing | ready | failed
  "progress": 45,
  "encodedSize": 5242880, // optional, current encoded size in bytes
  "metadata": { /* optional, encoding metadata when ready */ },
  "error": null // or error message if failed
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "A1b2C3d4",
    "name": "renamed-video.mp4",
    "parentId": "folder_new_123",
    "projectId": "proj_123",
    "orderIndex": 2,
    "status": "ready",
    "progress": 100,
    "encodingJobId": "234e5678-f89c-23e4-b567-537725285111",
    "originalSize": 52428800,
    "encodedSize": 15728640,
    "duration": 120,
    "resolution": "1920x1080",
    "streamingUrl": "https://cdn.framesend.com/A1b2C3d4/master.m3u8",
    "thumbnailUrl": "https://cdn.framesend.com/A1b2C3d4/thumbnail.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T10:30:00.000Z"
  }
}
```

### Delete Video
**DELETE** `/api/videos/:id`

Delete a video and its encoded files.

#### Response
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### Upload Video Thumbnail
**PUT** `/api/videos/:id/thumbnail`

Upload a thumbnail image for a video.

#### Request Body
```json
{
  "type": "hero", // hero | poster | sprite
  "path": "thumbnails/hero_4k.jpg",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "videoId": "A1b2C3d4",
    "thumbnailUrl": "https://cdn.framesend.com/A1b2C3d4/thumbnails/hero_4k.jpg",
    "type": "hero",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Upload Video Storyboard
**PUT** `/api/videos/:id/storyboard`

Upload storyboard sprite and metadata for video scrubbing.

#### Request Body
```json
{
  "imagePath": "thumbnails/storyboard.jpg",
  "metadataPath": "thumbnails/storyboard.json",
  "thumbnailCount": 120,
  "interval": 2, // seconds between thumbnails
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "videoId": "A1b2C3d4",
    "storyboardUrl": "https://cdn.framesend.com/A1b2C3d4/thumbnails/storyboard.jpg",
    "metadataUrl": "https://cdn.framesend.com/A1b2C3d4/thumbnails/storyboard.json",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Upload HLS Segment
**PUT** `/api/videos/:id/segment`

Upload an HLS segment during encoding.

#### Request Body
```json
{
  "rendition": "720p", // rendition name
  "codec": "h264", // h264 | av1
  "segmentNumber": 5,
  "segmentPath": "renditions/h264/720p/segment_0005.m4s",
  "size": 524288, // segment size in bytes
  "duration": 6, // segment duration in seconds
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "videoId": "A1b2C3d4",
    "segmentUrl": "https://cdn.framesend.com/A1b2C3d4/renditions/h264/720p/segment_0005.m4s",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note**: When marking video as "ready" via PUT `/api/videos/:id`, include:
- The final `encodedSize` which represents the total size of all encoded files
- Complete `metadata` object with encoding details (renditions, audio tracks, etc.)

---

## Encoding

### Start Encoding Job
**POST** `/api/encoding/jobs`

Start a new encoding job for uploaded video file.

#### Request Body
```json
{
  "videoId": "A1b2C3d4",
  "sourcePath": "/uploads/temp/A1b2C3d4_original.mp4",
  "settings": {
    "codec": "h264", // h264 | av1
    "qualityLadder": "standard" // standard | high | custom
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "234e5678-f89c-23e4-b567-537725285111",
    "videoId": "A1b2C3d4",
    "status": "queued",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Encoding Job Status
**GET** `/api/encoding/jobs/:jobId`

Get current status of encoding job.

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "234e5678-f89c-23e4-b567-537725285111",
    "videoId": "A1b2C3d4",
    "status": "processing",
    "progress": {
      "percent": 45,
      "currentStage": "transcoding",
      "stages": {
        "validation": 100,
        "transcoding": 45,
        "packaging": 0
      }
    },
    "startedAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

### Cancel Encoding Job
**DELETE** `/api/encoding/jobs/:jobId`

Cancel an active encoding job.

#### Response
```json
{
  "success": true,
  "data": {
    "jobId": "234e5678-f89c-23e4-b567-537725285111",
    "cancelled": true
  }
}
```

---

## Upload

### Get Upload URL
**POST** `/api/upload/url`

Get a pre-signed URL for direct file upload.

#### Request Body
```json
{
  "fileName": "video.mp4",
  "fileSize": 52428800, // bytes
  "projectId": "proj_123",
  "parentId": "folder_123" // optional
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://upload.framesend.com/temp/upload_123",
    "uploadId": "upload_123",
    "expiresAt": "2024-01-15T11:30:00.000Z"
  }
}
```

### Complete Upload
**POST** `/api/upload/complete`

Notify server that upload is complete.

#### Request Body
```json
{
  "uploadId": "upload_123",
  "fileName": "video.mp4",
  "projectId": "proj_123",
  "parentId": "folder_123"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "videoId": "B2c3D4e5",
    "encodingJobId": "234e5678-f89c-23e4-b567-537725285111"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User doesn't have permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `FOLDER_NOT_EMPTY` | 409 | Cannot delete non-empty folder |
| `ENCODING_FAILED` | 500 | Video encoding failed |
| `UPLOAD_EXPIRED` | 410 | Upload URL has expired |
| `QUOTA_EXCEEDED` | 402 | Storage quota exceeded |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## WebSocket Events (Future)

For real-time updates, connect to WebSocket endpoint:
```
wss://api.framesend.com/ws
```

### Events

#### Encoding Progress
```json
{
  "type": "encoding:progress",
  "data": {
    "jobId": "234e5678-f89c-23e4-b567-537725285111",
    "videoId": "A1b2C3d4",
    "progress": 75,
    "stage": "transcoding"
  }
}
```

#### Encoding Complete
```json
{
  "type": "encoding:complete",
  "data": {
    "jobId": "234e5678-f89c-23e4-b567-537725285111",
    "videoId": "A1b2C3d4",
    "streamingUrl": "https://cdn.framesend.com/A1b2C3d4/master.m3u8"
  }
}
```

#### File Updated
```json
{
  "type": "file:updated",
  "data": {
    "id": "A1b2C3d4",
    "type": "video",
    "changes": {
      "name": "new-name.mp4"
    }
  }
}
```

---

## Rate Limiting

- **Default**: 1000 requests per hour
- **Upload**: 100 uploads per hour
- **Encoding**: 50 encoding jobs per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1705316400
```

---

## Notes for Implementation

1. **IDs**: Use prefixed IDs for clarity (e.g., `proj_`, `folder_` for UUIDs, 8-char nanoIDs for videos)
2. **Timestamps**: Always include `createdAt` and `updatedAt`
3. **Soft Deletes**: Consider implementing soft deletes for recovery
4. **Pagination**: Add pagination for list endpoints when needed
5. **Filtering**: Add query parameters for filtering/sorting lists
6. **Validation**: Validate all inputs server-side
7. **Permissions**: Check user owns resources before operations
8. **Atomicity**: Ensure move operations are atomic
9. **Consistency**: Update parent folder stats when contents change
10. **Caching**: Cache frequently accessed data (project lists, folder contents)

---

## Encoding Metadata Structure

When a video encoding completes, the following metadata structure is sent with the status update:

```json
{
  "id": "A1b2C3d4",
  "duration": 120.5, // seconds
  "source": {
    "size": 52428800, // original file size in bytes
    "bitrate": 3500000, // bps
    "video": {
      "codec": "h264",
      "width": 1920,
      "height": 1080,
      "frameRate": 29.97,
      "bitRate": 3000000,
      "pixelFormat": "yuv420p",
      "colorSpace": "bt709",
      "colorPrimaries": "bt709",
      "colorTransfer": "bt709",
      "aspectRatio": "16:9"
    },
    "audio": {
      "codec": "aac",
      "channels": 2,
      "channelLayout": "stereo",
      "sampleRate": 48000,
      "bitRate": 128000
    }
  },
  "encoded": {
    "renditions": [
      {
        "name": "720p",
        "codec": "h264",
        "width": 1280,
        "height": 720,
        "targetBitrate": "2500k",
        "actualBitrate": 2450000,
        "profile": "main",
        "level": "3.1",
        "playlistPath": "renditions/h264/720p/playlist.m3u8",
        "segmentCount": 20,
        "totalSize": 6144000,
        "averageSegmentSize": 307200,
        "segmentDuration": 6
      }
    ],
    "audio": {
      "default": {
        "path": "audio/default.m4a",
        "codec": "aac",
        "bitrate": "128k",
        "channels": 2
      },
      "upgraded": {
        "path": "audio/upgraded.m4a",
        "codec": "aac",
        "bitrate": "192k",
        "channels": 2
      }
    },
    "hlsSegmentDuration": 6,
    "masterPlaylist": "master.m3u8",
    "outputSize": 15728640, // total size of all encoded files
    "fileCount": 45
  },
  "thumbnails": {
    "hero": "thumbnails/hero_4k.jpg",
    "storyboard": {
      "image": "thumbnails/storyboard.jpg",
      "data": "thumbnails/storyboard.json"
    }
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "encodingDuration": 45000 // milliseconds
}
```

## Maintenance

**IMPORTANT**: This API specification must be kept up-to-date as the application evolves. When adding or modifying API calls in the application:

1. Update this document with new endpoints or changes
2. Update request/response schemas if they change
3. Add new error codes if introduced
4. Document any new WebSocket events
5. Note any breaking changes with version numbers

Last Updated: 2025-07-30