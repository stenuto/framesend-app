/**
 * Encoding utility functions for the renderer process
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
 * Available resolution options for custom rungs
 */
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
 * Default custom rungs configuration
 */
export const DEFAULT_CUSTOM_RUNGS = [
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
];