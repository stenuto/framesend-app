# Video Encoder Package Documentation

## Overview

The video encoder package is the core video processing engine for Framesend. It manages video encoding jobs, FFmpeg processes, and generates HLS-compatible output with adaptive bitrate streaming.

## Architecture

```
video-encoder/
├── src/
│   ├── core/
│   │   ├── VideoEncodingService.js  # Main service that manages encoding jobs
│   │   └── VideoJob.js              # Individual encoding job handler
│   ├── config/
│   │   └── encoding-presets.js      # Encoding ladders and configuration
│   └── utils/
│       ├── fluent-ffmpeg-wrapper.js # FFmpeg command wrapper
│       ├── progress-tracker.js      # Multi-stage progress tracking
│       ├── thumbnail-generator.js   # Thumbnail and storyboard generation
│       ├── hls-manifest.js         # HLS manifest generation
│       ├── settings-loader.js      # Dynamic settings management
│       └── binary-setup.js         # FFmpeg binary management
```

## Core Classes

### VideoEncodingService

The main service that manages the encoding queue and job lifecycle.

**Key responsibilities:**
- Job queue management with concurrency control
- Dynamic settings loading
- Binary path management
- Event emission for job status updates

**Usage:**
```javascript
const service = new VideoEncodingService({
  outputDir: '/path/to/output',
  tempDir: '/path/to/temp',
  maxParallelJobs: 1,
  ffmpegPath: '/path/to/ffmpeg',
  ffprobePath: '/path/to/ffprobe'
});

const job = await service.queueVideo('/path/to/video.mp4');
```

### VideoJob

Handles the complete encoding pipeline for a single video.

**Pipeline stages:**
1. **Probe** - Extract video metadata
2. **Plan** - Determine encoding renditions based on source and settings
3. **Audio** - Extract audio tracks (128k default, 192k upgraded)
4. **Encode** - Create video renditions (parallel processing)
5. **Assets** - Generate thumbnails and storyboards
6. **Captions** - Generate captions (if Whisper available)
7. **Manifest** - Create HLS master playlist
8. **Metadata** - Write job metadata
9. **Finalize** - Cleanup and verification

## Encoding Configuration

### Quality Ladders

**H.264 Ladder:**
- 360p, 540p, 720p, 1080p, 1440p, 2160p
- Capped-CRF mode (CRF 22 with bitrate caps)
- Profile/level appropriate for each resolution

**AV1 Ladder:**
- 720p, 1080p, 1440p, 2160p
- SVT-AV1 encoder with optimized presets
- 10-bit encoding for better quality

### Bitrate Calculation

Bitrates are calculated dynamically based on:
- Resolution (width × height)
- Frame rate
- Bits per pixel (BPP) targets

Formula: `bitrate = pixels × bpp × fps / 1000`

### Aspect Ratio Handling

- Original aspect ratios are always maintained
- Width is calculated from target height
- No upscaling - source resolution is used as maximum

## Settings System

Encoding settings are loaded from a JSON file and can be changed without restarting:

```json
{
  "h264": {
    "enabled": true,
    "rungs": {
      "360p": true,
      "720p": true,
      "1080p": false,
      "2160p": true
    }
  },
  "av1": {
    "enabled": true,
    "rungs": {
      "2160p": true
    }
  }
}
```

## Progress Tracking

Multi-stage progress tracking with weighted stages:
- Each stage has a weight (e.g., encoding is 85% of total time)
- Per-rendition progress during encoding
- Real-time updates via event emission

## Thumbnail Generation

### Hero Thumbnail
- Single high-quality frame from middle of video
- 4K resolution (3840px wide)
- JPEG quality 90

### Storyboard Sprite
- Multiple thumbnails in a sprite sheet
- Dynamic interval calculation based on duration:
  - < 10s: 1 second intervals
  - 10-60s: 2 second intervals
  - 1-5 min: 5 second intervals
  - And so on...
- Maximum ~120 thumbnails for optimal scrubbing

## Process Management

### FFmpeg Process Tracking
- Each process is tracked by job ID
- Graceful cancellation with SIGTERM → SIGKILL
- Automatic cleanup on job completion/error

### Resource Limits
```javascript
{
  maxParallelJobs: 1,      // One job at a time
  maxFFmpegProcesses: 6,   // Parallel renditions per job
  memoryLimit: 0.8,        // 80% of available memory
  cpuLimit: 0.95          // 95% of CPU
}
```

## Error Handling

- Each stage has isolated error handling
- Errors include stage information for debugging
- Non-critical failures (e.g., storyboard) don't stop encoding
- Comprehensive error messages with context

## Output Structure

```
{jobId}/
├── renditions/
│   ├── h264/
│   │   ├── 360p/
│   │   │   ├── playlist.m3u8
│   │   │   ├── init.mp4
│   │   │   └── segment_0001.m4s
│   │   └── 720p/...
│   └── av1/
│       └── 2160p/...
├── audio/
│   ├── default.m4a  (128k AAC)
│   └── upgraded.m4a (192k AAC)
├── thumbnails/
│   ├── hero_4k.jpg
│   ├── storyboard.jpg
│   └── storyboard.json
├── master.m3u8
└── metadata.json
```

## Event System

The service emits events for job lifecycle:
- `job:start` - Job begins processing
- `job:progress` - Progress updates
- `job:complete` - Job finished successfully
- `job:error` - Job failed
- `job:cancelled` - Job was cancelled

## Best Practices

1. **Always await initialization** before queuing videos
2. **Handle all events** for proper UI updates
3. **Check binary availability** before starting
4. **Monitor resource usage** for large files
5. **Clean up temp files** after processing

## Future Enhancements

- Whisper integration for automatic captions
- Hardware acceleration support
- Multi-pass encoding options
- Custom filter chain support
- Cloud storage integration