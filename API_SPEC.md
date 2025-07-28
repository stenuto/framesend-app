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

## Common Types

### Timestamps
All timestamps are ISO 8601 strings in UTC:
```
"2024-01-15T10:30:00.000Z"
```

### IDs
All IDs are unique strings (UUID v4 recommended):
```
"123e4567-e89b-12d3-a456-426614174000"
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
      "fileCount": 12,
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
    "fileCount": 12,
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
    "fileCount": 0,
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
    "fileCount": 12,
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
        "id": "video_123",
        "name": "hero-video.mp4",
        "parentId": "folder_123",
        "projectId": "proj_123",
        "orderIndex": 0,
        "status": "ready", // queued | processing | ready | failed
        "progress": 100,
        "duration": 120, // seconds
        "size": 52428800, // bytes
        "resolution": "1920x1080",
        "encodingJobId": "job_123",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Folders

### Create Folder
**POST** `/api/folders`

Create a new folder.

#### Request Body
```json
{
  "name": "New Folder",
  "parentId": "folder_parent_123", // null for root
  "projectId": "proj_123",
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
  "encodingJobId": "job_123",
  "size": 52428800, // bytes
  "duration": 120, // seconds
  "resolution": "1920x1080"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "video_new_123",
    "name": "product-demo.mp4",
    "parentId": "folder_123",
    "projectId": "proj_123",
    "orderIndex": 0,
    "status": "queued",
    "progress": 0,
    "encodingJobId": "job_123",
    "size": 52428800,
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
    "id": "video_123",
    "name": "product-demo.mp4",
    "parentId": "folder_123",
    "projectId": "proj_123",
    "orderIndex": 0,
    "status": "ready",
    "progress": 100,
    "encodingJobId": "job_123",
    "size": 52428800,
    "duration": 120,
    "resolution": "1920x1080",
    "streamingUrl": "https://cdn.framesend.com/video_123/master.m3u8",
    "thumbnailUrl": "https://cdn.framesend.com/video_123/thumbnail.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Video
**PUT** `/api/videos/:id`

Update video metadata or move to different folder.

#### Request Body
```json
{
  "name": "renamed-video.mp4",
  "parentId": "folder_new_123", // optional, to move
  "orderIndex": 2 // optional, to reorder
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "video_123",
    "name": "renamed-video.mp4",
    "parentId": "folder_new_123",
    "projectId": "proj_123",
    "orderIndex": 2,
    "status": "ready",
    "progress": 100,
    "encodingJobId": "job_123",
    "size": 52428800,
    "duration": 120,
    "resolution": "1920x1080",
    "streamingUrl": "https://cdn.framesend.com/video_123/master.m3u8",
    "thumbnailUrl": "https://cdn.framesend.com/video_123/thumbnail.jpg",
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

### Update Video Encoding Status
**PATCH** `/api/videos/:id/status`

Update video encoding status (for server-side encoding updates).

#### Request Body
```json
{
  "status": "processing", // queued | processing | ready | failed
  "progress": 45,
  "error": null // or error message if failed
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "video_123",
    "status": "processing",
    "progress": 45,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Encoding

### Start Encoding Job
**POST** `/api/encoding/jobs`

Start a new encoding job for uploaded video file.

#### Request Body
```json
{
  "videoId": "video_123",
  "sourcePath": "/uploads/temp/video_123_original.mp4",
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
    "jobId": "job_new_123",
    "videoId": "video_123",
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
    "jobId": "job_123",
    "videoId": "video_123",
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
    "jobId": "job_123",
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
    "videoId": "video_new_123",
    "encodingJobId": "job_new_123"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid auth token |
| `FORBIDDEN` | User doesn't have permission |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `FOLDER_NOT_EMPTY` | Cannot delete non-empty folder |
| `ENCODING_FAILED` | Video encoding failed |
| `UPLOAD_EXPIRED` | Upload URL has expired |
| `QUOTA_EXCEEDED` | Storage quota exceeded |
| `SERVER_ERROR` | Internal server error |

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
    "jobId": "job_123",
    "videoId": "video_123",
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
    "jobId": "job_123",
    "videoId": "video_123",
    "streamingUrl": "https://cdn.framesend.com/video_123/master.m3u8"
  }
}
```

#### File Updated
```json
{
  "type": "file:updated",
  "data": {
    "id": "video_123",
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

1. **IDs**: Use prefixed IDs for clarity (e.g., `proj_`, `video_`, `folder_`, `job_`)
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

## Maintenance

**IMPORTANT**: This API specification must be kept up-to-date as the application evolves. When adding or modifying API calls in the application:

1. Update this document with new endpoints or changes
2. Update request/response schemas if they change
3. Add new error codes if introduced
4. Document any new WebSocket events
5. Note any breaking changes with version numbers

Last Updated: 2025-07-28