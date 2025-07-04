/**
 * Video encoding presets and configuration
 * Following best practices for HLS streaming with adaptive bitrate
 */

// Adaptive bitrate ladder for H.264 encoding
// Following Apple HLS recommendations with capped-CRF mode
export const H264_LADDER = [
  {
    name: '360p',
    height: 360,
    width: 640,
    maxrate: '800k',
    bufsize: '1200k',
    profile: 'main',
    level: '3.0',
  },
  // {
  //   name: '540p',
  //   height: 540,
  //   width: 960,
  //   maxrate: '1300k',
  //   bufsize: '2000k',
  //   profile: 'main',
  //   level: '3.1',
  // },
  {
    name: '720p',
    height: 720,
    width: 1280,
    maxrate: '3000k',
    bufsize: '4500k',
    profile: 'main',
    level: '3.1',
  },
  // {
  //   name: '1080p',
  //   height: 1080,
  //   width: 1920,
  //   maxrate: '7800k',
  //   bufsize: '11700k',
  //   profile: 'high',
  //   level: '4.0',
  //   audioUpgrade: true, // Flag to upgrade audio to 192k
  // },
  {
    name: '1440p',
    height: 1440,
    width: 2560,
    maxrate: '11000k',
    bufsize: '16500k',
    profile: 'high',
    level: '5.0',
    audioUpgrade: true,
  },
  // {
  //   name: '2160p',
  //   height: 2160,
  //   width: 3840,
  //   maxrate: '13000k',
  //   bufsize: '18000k',
  //   profile: 'high',
  //   level: '5.1',
  //   audioUpgrade: true,
  // },
];

// AV1 configuration for 4K rung using libsvtav1
export const AV1_CONFIG = {
  name: 'av1_2160p',
  codec: 'libsvtav1',
  preset: 6, // Good balance of speed and quality (~20x faster than very-slow)
  crf: 28, // Better quality than H.264 at lower bitrate
  width: 3840,
  height: 2160,
  maxrate: '18000k',
  bufsize: '27000k',
  pixelFormat: 'yuv420p10le', // 10-bit for future-proofing
  audioUpgrade: true, // 192k audio
  // SVT-AV1 specific parameters
  svtav1Params: {
    'aq-mode': 2, // Adaptive quantization mode
    'tile-columns': 2, // 4 tiles (2x1) for faster decode
    'tile-rows': 1,
    'row-mt': 1, // Row-based multithreading
    'enable-overlays': 1, // Enable overlay frames
  },
};

// H.264 encoding parameters optimized for HLS
export const H264_ENCODING_PARAMS = {
  codec: 'libx264',
  preset: 'slow', // Good speed/quality trade-off
  crf: 22, // Capped-CRF mode for consistent quality
  pixelFormat: 'yuv420p', // Standard 8-bit for maximum compatibility
  colorSpace: 'bt709', // HD color space
  // x264 specific parameters for HLS optimization
  'x264-params': [
    'keyint=60',       // Keyframe interval: 2 seconds at 30fps (Apple recommendation)
    'min-keyint=60',   // Fixed GOP size for HLS
    'no-scenecut',     // Disable scene cut detection for predictable segments
    'bframes=3',       // B-frames as per reference
    'ref=4',           // Reference frames as per reference
    'rc-lookahead=40', // Lookahead as per reference
    'aq-mode=1',       // Adaptive quantization mode
    'threads=0',       // Use all available threads
  ].join(':'),
};

// HLS segmentation parameters
export const HLS_PARAMS = {
  'hls_time': 6,                           // 6-second segments (Apple recommendation)
  'hls_playlist_type': 'vod',              // VOD playlist type
  'hls_segment_type': 'fmp4',              // CMAF compliant fragmented MP4
  'hls_flags': 'independent_segments', // Keep flags simple for now
  'hls_segment_filename': 'segment_%04d.m4s', // Segment naming pattern (.m4s for fMP4)
  'master_pl_name': 'playlist.m3u8',       // Variant playlist name
};

// Audio encoding parameters
export const AUDIO_PARAMS = {
  default: {
    codec: 'aac',
    bitrate: '128k',
    channels: 2,
    sampleRate: 48000,
  },
  upgraded: {
    codec: 'aac',
    bitrate: '192k', // Upgraded bitrate for 1080p+
    channels: 2,
    sampleRate: 48000,
  },
};

// Thumbnail generation settings
export const THUMBNAIL_PARAMS = {
  hero: {
    // Extract a high-quality hero image
    time: '50%', // Middle of video
    width: 3840, // 4K width
    quality: 90, // JPEG quality
  },
  storyboard: {
    // Generate storyboard sprite for timeline preview
    interval: 10, // Every 10 seconds
    width: 160,   // Thumbnail width
    height: 90,   // Thumbnail height
    columns: 10,  // Thumbnails per row
    quality: 70,  // JPEG quality
  },
};

// Encoding options
export const ENCODING_OPTIONS = {
  enableAV1: true, // Set to false to disable AV1 encoding completely
  av1MinHeight: 1080, // Minimum source height to enable AV1 encoding
};

// Progress stage weights for accurate progress reporting
export const PROGRESS_WEIGHTS = {
  probe: 0.01,      // 1% - Quick metadata extraction
  plan: 0.01,       // 1% - Planning encoding ladder
  audio: 0.02,      // 2% - Audio extraction
  encode: 0.85,     // 85% - Main encoding work (this takes the most time)
  assets: 0.05,     // 5% - Thumbnail generation
  captions: 0.03,   // 3% - Whisper transcription
  manifest: 0.01,   // 1% - HLS manifest generation
  metadata: 0.01,   // 1% - Metadata file creation
  finalize: 0.01,   // 1% - Cleanup and verification
};

// File validation settings
export const VALIDATION = {
  maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
  supportedExtensions: ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg', '.wmv', '.flv'],
  supportedCodecs: ['h264', 'hevc', 'vp9', 'vp8', 'mpeg4', 'mpeg2video'],
  supportedContainers: ['mov,mp4,m4a,3gp,3g2,mj2', 'matroska,webm', 'avi'],
};

// System resource limits
export const RESOURCE_LIMITS = {
  maxParallelJobs: 1,      // Focus on one job at a time for faster completion
  maxFFmpegProcesses: 6,   // Allow more concurrent FFmpeg processes per job
  memoryLimit: 0.8,        // Use up to 80% of available memory
  cpuLimit: 0.95,          // Use up to 95% of CPU for maximum speed
};