# Video Encoding Implementation Plan

## High-level Pipeline (runs entirely in the Electron companion app)

### Core Pipeline Stages

1. **Probe** – ffprobe gathers width, height, fps, duration, audio tracks, colour info and stores it in RAM.

2. **Plan renditions** – decide the highest rung ≤ input height (max 2160p) and build a ladder: H.264 rungs at 360p → 540p → 720p → 1080p → 1440p → 2160p (skip anything above the source); one AV1 10-bit rung at the top. Ladder always preserves the original aspect ratio; no upscaling (e.g. a 3800 × 2050 master tops out at 1440p).

3. **Extract audio** – save a lossless AAC track and transcode a separate MP3 for podcast-style use.

4. **Encode video** – parallel ffmpeg jobs under a PQueue: H.264 8-bit (CRF 20-23, slow preset) for every rung, plus AV1 10-bit (CRF 28, cpu-used 4) at the top rung.

5. **Generate visual assets** – pick a mid-scene frame for a 4K "hero" JPG; build a tiled storyboard sprite and companion JSON for timeline hover previews.

6. **Captions** – run local Whisper-cpp and store word-level output as JSON.

7. **Write metadata** – compile a single metadata.json that drives future manifest generation.

8. **Finalise** – integrity-check, tidy temp files, emit "complete".

### Progress Weighting for a Single Job
- Probe: 5%
- Plan: 5%
- Audio: 4%
- Encode: 60%
- Assets: 8%
- Captions: 10%
- Metadata: 3%
- Finalise: 5%

## Frontend Validation (Renderer Process)

```javascript
// In upload.vue - Enhanced file validation
const validateVideoFile = (file) => {
  // Check file extension
  const validExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg', '.wmv', '.flv']
  
  // Check MIME type
  const validMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']
  
  // Basic size check (warn for very large files)
  const maxSize = 10 * 1024 * 1024 * 1024 // 10GB warning threshold
  
  return {
    isValid: boolean,
    warnings: string[],
    errors: string[]
  }
}
```

## IPC Communication Structure

```javascript
// Renderer → Main
'video:validate' - Quick probe for validation
'video:encode' - Start encoding job
'video:cancel' - Cancel encoding job

// Main → Renderer  
'encoding:progress' - Progress updates
'encoding:complete' - Job complete
'encoding:error' - Job failed
```

## Encoding Parameters

### Per-pixel Bitrate Rule of Thumb (fps ≈ 30)
- **H.264**: 0.10 bpp ≤ 540p, 0.07 bpp 720-1080p, 0.05 bpp ≥ 1440p
- **AV1 10-bit**: 0.07 / 0.05 / 0.035 bpp over the same ranges
- **Target kbps** = width × height × bpp × fps ÷ 1000, so a square 2160 × 2160 AV1 stream at 0.035 bpp needs ~4.9 Mbps

### Adaptive Bitrate Ladder for HLS
```javascript
const renditionLadder = [
  { height: 360,  bitrate: '800k',   profile: 'baseline', level: '3.0' },
  { height: 540,  bitrate: '1200k',  profile: 'main',     level: '3.1' },
  { height: 720,  bitrate: '2500k',  profile: 'main',     level: '3.1' },
  { height: 1080, bitrate: '5000k',  profile: 'high',     level: '4.0' },
  { height: 1440, bitrate: '8000k',  profile: 'high',     level: '5.0' },
  { height: 2160, bitrate: '12000k', profile: 'high',     level: '5.1' }
]

// AV1 for premium/future-proof delivery:
const av1TopRung = {
  codec: 'av1',
  crf: 28,
  'cpu-used': 4,
  bitDepth: 10
}
```

### H.264 Encoding Parameters for HLS
```javascript
const h264Params = {
  preset: 'slow',        // Better compression
  crf: 20-23,           // Quality-based encoding
  'x264-params': [
    'keyint=120',       // 4 seconds at 30fps
    'min-keyint=120',   // Fixed GOP for HLS
    'no-scenecut',      // Predictable segments
    'bframes=3',        // B-frame optimization
    'ref=5'             // Reference frames
  ],
  pixelFormat: 'yuv420p', // Maximum compatibility
  colorSpace: 'bt709'     // HD color space
}

// HLS-specific parameters:
const hlsParams = {
  'hls_time': 6,              // 6-second segments
  'hls_playlist_type': 'vod', // VOD playlist
  'hls_segment_filename': 'segment_%03d.ts',
  'hls_flags': 'independent_segments'
}
```

## Output Structure

### Key outputs placed under [userData]/videos/[nano-id]/
```
├── renditions/
│   ├── h264/
│   │   ├── 360p/
│   │   │   ├── playlist.m3u8
│   │   │   └── segment_*.ts
│   │   ├── 540p/
│   │   ├── 720p/
│   │   ├── 1080p/
│   │   ├── 1440p/
│   │   └── 2160p/
│   └── av1/
│       └── top/
│           ├── playlist.m3u8
│           └── segment_*.mp4
├── audio/
│   ├── original.m4a    # AAC audio
│   └── audio.mp3       # MP3 for compatibility
├── thumbnails/
│   ├── hero_4k.jpg
│   ├── storyboard.jpg
│   └── storyboard.json
├── captions/
│   ├── whisper.json    # Word-level timestamps
│   └── captions.vtt    # WebVTT for HLS
├── master.m3u8         # Master HLS playlist
├── metadata.json       # Single source of truth
└── input.mp4          # Optional copy of original
```

## Essential Fields in metadata.json
- `id`: Unique identifier (nano-id)
- `duration`: Video duration in seconds
- `frameRate`: FPS
- `aspectRatio`: Width:Height ratio
- `colorInfo`: Primaries, transfer characteristics, bit depth
- `audioTracks`: Array of audio track info
- `renditions`: Array of encoded variants
  - `id`, `width`, `height`, `codec`, `profile`, `level`
  - `bitrate`, `targetKbps`, `actualKbps`
  - `hlsPath`: Path to variant playlist
- `thumbnails`: Hero image and storyboard paths
- `storyboardGrid`: Sprite dimensions and timing
- `captions`: Path to caption files
- `createdAt`: ISO timestamp
- `encodingDuration`: Total encoding time
- `fileSize`: Original and total output size

## Node-side Structure

```javascript
class VideoEncodingService extends EventEmitter {
  constructor() {
    super()
    // Initialize PQueue for parallel processing control
    this.queue = new PQueue({ concurrency: 2 })
    // Set up paths for ffmpeg, ffprobe, whisper-cpp binaries
    this.setupBinaries()
  }
  
  async encodeVideo(inputPath, outputDir) {
    const job = new VideoJob(inputPath, outputDir)
    
    // Pipeline stages with error handling and progress emission
    await job._probe()           // 5% - Extract video metadata
    await job._planRenditions()  // 5% - Plan encoding ladder
    await job._extractAudio()    // 4% - Extract audio tracks
    await job._encodeStreams()   // 60% - Parallel video encoding
    await job._genAssets()       // 8% - Generate thumbnails
    await job._genCaptions()     // 10% - Whisper transcription
    await job._genManifest()     // 3% - Generate HLS manifests
    await job._writeMetadata()   // 3% - Write metadata.json
    await job._finalize()        // 5% - Cleanup and verify
    
    return job.metadata
  }
}

class VideoJob extends EventEmitter {
  // Private helper methods
  async _probe() { /* ffprobe implementation */ }
  async _planRenditions() { /* Ladder planning logic */ }
  async _extractAudio() { /* Audio extraction */ }
  async _encodeStreams() { /* Parallel encoding with PQueue */ }
  async _genAssets() { /* Thumbnail generation */ }
  async _genCaptions() { /* Whisper integration */ }
  async _genManifest() { /* HLS manifest generation */ }
  async _writeMetadata() { /* Metadata compilation */ }
  async _finalize() { /* Cleanup and verification */ }
  
  // Emit progress: {stage, localProgress, globalProgress}
}
```

## HLS Master Playlist Generation

Example master.m3u8 structure:
```
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS

# Audio groups
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",DEFAULT=YES,URI="audio/aac/playlist.m3u8"

# Video variants (lowest to highest)
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42001e,mp4a.40.2",AUDIO="audio"
renditions/h264/360p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=960x540,CODECS="avc1.4d001f,mp4a.40.2",AUDIO="audio"
renditions/h264/540p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.4d001f,mp4a.40.2",AUDIO="audio"
renditions/h264/720p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2",AUDIO="audio"
renditions/h264/1080p/playlist.m3u8

# Subtitles (if available)
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",DEFAULT=YES,AUTOSELECT=YES,LANGUAGE="en",URI="captions/captions.vtt"
```

## Performance Optimizations

1. **CPU Management**
   - Detect core count and limit parallel encodes
   - Use hardware acceleration when available (VideoToolbox on macOS, NVENC on NVIDIA, etc.)
   - Implement thermal throttling detection

2. **Disk I/O**
   - Use separate temp directory for encoding
   - Stream processing where possible
   - Clean up segments incrementally

3. **Memory Management**
   - Limit FFmpeg buffer sizes
   - Process video in chunks for large files
   - Monitor system memory pressure

## Error Handling & Recovery

1. **Retry Logic**
   - Network failures during probe
   - FFmpeg crashes (auto-restart with checkpoint)
   - Disk space monitoring
   - Corrupted input file detection

2. **Cleanup Strategy**
   - Track all temporary files in job manifest
   - Clean on error/cancel
   - Verify outputs before marking complete
   - Maintain partial progress for resume capability

## Integration Points

1. **Handler Registration** (`src/main/handlers/video.handler.js`)
2. **Store Integration** for job queue management
3. **Database** for persistent job tracking and history
4. **Progress Updates** via IPC for real-time UI updates