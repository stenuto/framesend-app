/**
 * Video encoding presets and configuration
 * Following best practices for HLS streaming with adaptive bitrate
 */

/**
 * Calculate bitrate based on resolution and bits per pixel
 * This ensures aspect ratio aware bitrates (e.g., square videos get higher bitrates)
 * @param {number} width - Video width in pixels
 * @param {number} height - Video height in pixels
 * @param {number} bpp - Target bits per pixel
 * @param {number} fps - Frame rate (default 30)
 * @returns {Object} Bitrate configuration with maxrate and bufsize
 */
export function calculateBitrate(width, height, bpp, fps = 30) {
  const pixels = width * height;
  const bitrate = Math.round(pixels * bpp * fps / 1000); // in kbps

  return {
    maxrate: `${bitrate}k`,
    bufsize: `${Math.round(bitrate * 1.5)}k`, // 1.5x bitrate for buffer
  };
}

// H.264 ladder - all available rungs
export const H264_LADDER = [
  {
    name: '360p',
    height: 360,
    targetBpp: 0.10,
    profile: 'main',
    level: '3.0',
  },
  {
    name: '540p',
    height: 540,
    targetBpp: 0.09,
    profile: 'main',
    level: '3.1',
  },
  {
    name: '720p',
    height: 720,
    targetBpp: 0.08,
    profile: 'main',
    level: '3.1',
  },
  {
    name: '1080p',
    height: 1080,
    targetBpp: 0.07,
    profile: 'high',
    level: '4.0',
    audioUpgrade: true,
  },
  {
    name: '1440p',
    height: 1440,
    targetBpp: 0.065,
    profile: 'high',
    level: '5.0',
    audioUpgrade: true,
  },
  {
    name: '2160p',
    height: 2160,
    targetBpp: 0.05,
    profile: 'high',
    level: '5.1',
    audioUpgrade: true,
  },
];

// AV1 ladder - matching H.264 rungs but with better efficiency
export const AV1_LADDER = [
  {
    name: '720p',
    height: 720,
    targetBpp: 0.06, // ~25% more efficient than H.264
    preset: 8,
    crf: 32,
  },
  {
    name: '1080p',
    height: 1080,
    targetBpp: 0.06,
    preset: 7,
    crf: 30,
    audioUpgrade: true,
  },
  {
    name: '1440p',
    height: 1440,
    targetBpp: 0.06,
    preset: 6,
    crf: 28,
    audioUpgrade: true,
  },
  {
    name: '2160p',
    height: 2160,
    targetBpp: 0.06,
    preset: 6,
    crf: 28,
    audioUpgrade: true,
  },
];

// AV1 general configuration
export const AV1_CONFIG = {
  codec: 'libsvtav1',
  pixelFormat: 'yuv420p10le', // 10-bit for future-proofing
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

// Default encoding settings structure
export const DEFAULT_ENCODING_SETTINGS = {
  h264: {
    enabled: true,
    rungs: {
      '360p': true,
      '540p': false,
      '720p': true,
      '1080p': false,
      '1440p': true,
      '2160p': false,
    }
  },
  av1: {
    enabled: true,
    rungs: {
      '720p': false,
      '1080p': false,
      '1440p': false,
      '2160p': true,
    }
  }
};

// System resource limits
export const RESOURCE_LIMITS = {
  maxParallelJobs: 1,      // Focus on one job at a time for faster completion
  maxFFmpegProcesses: 6,   // Allow more concurrent FFmpeg processes per job
  memoryLimit: 0.8,        // Use up to 80% of available memory
  cpuLimit: 0.95,          // Use up to 95% of CPU for maximum speed
};