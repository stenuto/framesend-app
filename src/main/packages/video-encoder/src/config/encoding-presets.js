/**
 * Video encoding presets and configuration
 * Following best practices for HLS streaming with adaptive bitrate
 */

/**
 * Map quality slider value (1-5) to CRF value
 * Lower CRF = better quality, larger files
 * Higher CRF = lower quality, smaller files
 * @param {number} quality - Quality slider value (1-5)
 * @param {string} codec - 'h264' or 'av1'
 * @returns {number} CRF value
 */
export function mapQualityToCRF(quality, codec = 'h264') {
  // H.264 CRF range: 15-32 (lower is better)
  // Quality 1 = CRF 32 (fastest encoding, smallest files, lower quality)
  // Quality 3 = CRF 23 (balanced - good quality/size trade-off)
  // Quality 5 = CRF 15 (excellent quality, larger files, slower encoding)
  if (codec === 'h264') {
    const crfMap = {
      1: 32,    // Very compressed, suitable for preview/draft
      2: 27.5,  // Compressed, acceptable quality
      3: 23,    // Balanced - recommended default
      4: 19,    // High quality
      5: 15     // Excellent quality, near-lossless
    };
    return crfMap[quality] || 23;
  }
  
  // AV1 CRF range: 12-40 (lower is better, different scale than H.264)
  // Quality 1 = CRF 40 (fastest, very compressed)
  // Quality 3 = CRF 25 (balanced - good for most use cases)
  // Quality 5 = CRF 12 (exceptional quality for archival/master)
  if (codec === 'av1') {
    const crfMap = {
      1: 40,    // Very compressed, fast encoding
      2: 32.5,  // Compressed but acceptable
      3: 25,    // Balanced - recommended default
      4: 18.5,  // High quality
      5: 12     // Exceptional quality, large files
    };
    return crfMap[quality] || 25;
  }
  
  return 23; // Default fallback
}

/**
 * Map quality to bitrate multiplier
 * Higher quality should also slightly increase bitrate caps
 * @param {number} quality - Quality slider value (1-5)
 * @returns {number} Bitrate multiplier
 */
export function mapQualityToBitrateMultiplier(quality) {
  const multiplierMap = {
    1: 0.6,   // 40% lower bitrate cap - aggressive compression
    2: 0.8,   // 20% lower bitrate cap
    3: 1.0,   // Normal bitrate cap
    4: 1.25,  // 25% higher bitrate cap
    5: 1.5    // 50% higher bitrate cap - allow more bits for quality
  };
  return multiplierMap[quality] || 1.0;
}

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

// H.264 ladder - simplified to only essential rungs
export const H264_LADDER = [
  {
    name: '360p',
    height: 360,
    targetBpp: 0.10,
    profile: 'main',
    level: '3.0',
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
    name: '2160p',
    height: 2160,
    targetBpp: 0.05,
    profile: 'high',
    level: '5.1',
    audioUpgrade: true,
  },
];

// AV1 ladder - only 4K HQ option
export const AV1_LADDER = [
  {
    name: '2160p_hq',
    height: 2160,
    targetBpp: 0.06, // Will be overridden by CRF mode
    preset: 5,
    crf: 18,
    audioUpgrade: true,
    // AV1 HQ specific settings per user requirements
    profile: 0, // Main 10 profile
    pixelFormat: 'yuv420p10le', // 10-bit 4:2:0
  },
];

// AV1 general configuration - HQ 4K mode
export const AV1_CONFIG = {
  codec: 'libsvtav1',
  pixelFormat: 'yuv420p10le', // 10-bit 4:2:0
  // SVT-AV1 HQ parameters
  svtav1Params: {
    'preset': 5, // Speed-quality sweet spot
    'profile': 0, // Main 10 profile
    'tune': 0, // PSNR/BDRate-centric default
    'aq-mode': 1, // Content-adaptive quantization
    'sc-threshold': 40, // Modest scene-cut sensitivity
    'tile-columns': 2, // 1x2 tiling for smooth parallel decoding
    'tile-rows': 1,
    'film-grain': 0, // Disabled by default (can be enabled for grain sources)
    'fast-decode': 0, // Standard decode complexity
  },
};

// H.264 encoding parameters optimized for HLS
export const H264_ENCODING_PARAMS = {
  codec: 'libx264',
  preset: 'slow', // Good speed/quality trade-off
  crf: 23, // Default CRF for quality level 3 (will be overridden by per-rung settings)
  pixelFormat: 'yuv420p', // Standard 8-bit for maximum compatibility
  colorSpace: 'bt709', // HD color space
  // x264 specific parameters for HLS optimization
  'x264-params': [
    'keyint=240',       // Keyframe interval: 2 seconds GOP (240 frames at 30fps for AV1 compatibility)
    'min-keyint=240',   // Fixed GOP size for HLS
    'scenecut=40',      // Enable scene cut detection with threshold
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
      '720p': true,
      '1080p': true,
      '2160p': true,
    }
  },
  av1: {
    enabled: false, // AV1 4K HQ is optional, disabled by default
    rungs: {
      '2160p_hq': true,
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