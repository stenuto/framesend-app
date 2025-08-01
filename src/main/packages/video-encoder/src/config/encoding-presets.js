/**
 * Video encoding presets and configuration
 * Following best practices for HLS streaming with adaptive bitrate
 */

/**
 * Map quality slider value (1-5) to CRF value
 * Lower CRF = better quality, larger files
 * Higher CRF = lower quality, smaller files
 * @param {number} quality - Quality slider value (1-5)
 * @returns {number} CRF value
 */
export function mapQualityToCRF(quality) {
  // H.264 CRF range: 15-32 (lower is better)
  // Quality 1 = CRF 32 (fastest encoding, smallest files, lower quality)
  // Quality 3 = CRF 23 (balanced - good quality/size trade-off)
  // Quality 5 = CRF 15 (excellent quality, larger files, slower encoding)
  const crfMap = {
    1: 32,    // Very compressed, suitable for preview/draft
    2: 27.5,  // Compressed, acceptable quality
    3: 23,    // Balanced - recommended default
    4: 19,    // High quality
    5: 15     // Excellent quality, near-lossless
  };
  return crfMap[quality] || 23;
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


// H.264 encoding parameters optimized for HLS
export const H264_ENCODING_PARAMS = {
  codec: 'libx264',
  preset: 'slow', // Good speed/quality trade-off
  crf: 23, // Default CRF for quality level 3 (will be overridden by per-rung settings)
  pixelFormat: 'yuv420p', // Standard 8-bit for maximum compatibility
  colorSpace: 'bt709', // HD color space
  // x264 specific parameters for HLS optimization
  'x264-params': [
    'keyint=120',       // Keyframe interval: 2 seconds at 60fps (conservative for variable framerates)
    'min-keyint=120',   // Fixed GOP size for HLS
    'scenecut=0',       // Disable scene cut detection for consistent HLS segments
    'bframes=3',        // B-frames for compression efficiency
    'ref=4',            // Reference frames for quality
    'rc-lookahead=40',  // Lookahead for rate control
    'aq-mode=1',        // Adaptive quantization mode
    'threads=0',        // Use all available threads
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

// Available resolution options for custom rungs
export const RESOLUTION_OPTIONS = [
  { label: '240p', value: 240 },
  { label: '360p', value: 360 },
  { label: '480p', value: 480 },
  { label: '540p', value: 540 },
  { label: '720p (HD)', value: 720 },
  { label: '1080p (Full HD)', value: 1080 },
  { label: '1440p (2K)', value: 1440 },
  { label: '2160p (4K)', value: 2160 },
  { label: '4320p (8K)', value: 4320 },
];

/**
 * Get H.264 profile and level based on resolution height
 * @param {number} height - Resolution height in pixels
 * @returns {Object} Profile and level configuration
 */
export function getH264ProfileLevel(height) {
  if (height <= 360) {
    return { profile: 'baseline', level: '3.0' };
  } else if (height <= 480) {
    return { profile: 'main', level: '3.0' };
  } else if (height <= 720) {
    return { profile: 'main', level: '3.1' };
  } else if (height <= 1080) {
    return { profile: 'high', level: '4.0' };
  } else if (height <= 1440) {
    return { profile: 'high', level: '4.2' };
  } else if (height <= 2160) {
    return { profile: 'high', level: '5.1' };
  } else {
    // 8K and above
    return { profile: 'high', level: '6.2' };
  }
}

/**
 * Get target bits per pixel based on resolution
 * Higher resolutions can use lower BPP due to better efficiency
 * @param {number} height - Resolution height in pixels
 * @returns {number} Target bits per pixel
 */
export function getTargetBPP(height) {
  if (height <= 360) {
    return 0.12; // Higher BPP for low resolutions
  } else if (height <= 480) {
    return 0.10;
  } else if (height <= 720) {
    return 0.08;
  } else if (height <= 1080) {
    return 0.07;
  } else if (height <= 1440) {
    return 0.06;
  } else if (height <= 2160) {
    return 0.05;
  } else {
    // 8K
    return 0.04;
  }
}

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
  customRungs: [
    {
      id: '360p_default1',
      height: 360,
      quality: 2,
      enabled: true
    },
    {
      id: '720p_default2',
      height: 720,
      quality: 3,
      enabled: true
    },
    {
      id: '1080p_default3',
      height: 1080,
      quality: 3,
      enabled: true
    },
    {
      id: '2160p_default4',
      height: 2160,
      quality: 3,
      enabled: false
    }
  ],
  hardwareAcceleration: {
    enabled: true
  },
  streamingPreset: 'balanced',
  audioEnhancement: {
    enabled: true,
    level: 3
  }
};

// System resource limits
export const RESOURCE_LIMITS = {
  maxParallelJobs: 1,      // Focus on one job at a time for faster completion
  maxFFmpegProcesses: 6,   // Allow more concurrent FFmpeg processes per job
  memoryLimit: 0.8,        // Use up to 80% of available memory
  cpuLimit: 0.95,          // Use up to 95% of CPU for maximum speed
};