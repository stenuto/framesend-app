/**
 * @framesend/video-encoder
 * 
 * High-quality video encoding service for HLS streaming
 * with adaptive bitrate support
 * 
 * Features:
 * - Multi-resolution encoding (360p to 4K)
 * - HLS manifest generation
 * - Thumbnail extraction
 * - Progress tracking
 * - Queue management
 * - AV1 support for modern browsers
 */

export { VideoEncodingService } from './core/VideoEncodingService.js';
export { VideoJob } from './core/VideoJob.js';

// Utilities
export { validateVideoFile, validateEncodingOptions } from './utils/validation.js';
export { setupBinaries, downloadBinaries } from './utils/binary-setup.js';
export { ProgressTracker } from './utils/progress-tracker.js';

// Configuration
export * from './config/encoding-presets.js';

// Default export for convenience
import { VideoEncodingService } from './core/VideoEncodingService.js';
export default VideoEncodingService;