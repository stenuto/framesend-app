import fs from 'fs-extra';
import path from 'path';
import { VALIDATION } from '../config/encoding-presets.js';

/**
 * Validate video file for encoding
 * @param {string} filePath - Path to video file
 * @returns {Promise<Object>} Validation result
 */
export async function validateVideoFile(filePath) {
  const errors = [];
  const warnings = [];
  
  try {
    // Check if file exists
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      errors.push('File does not exist');
      return { isValid: false, errors, warnings };
    }
    
    // Check file stats
    const stats = await fs.stat(filePath);
    
    // Check if it's a file (not directory)
    if (!stats.isFile()) {
      errors.push('Path is not a file');
      return { isValid: false, errors, warnings };
    }
    
    // Check file size
    if (stats.size === 0) {
      errors.push('File is empty');
      return { isValid: false, errors, warnings };
    }
    
    if (stats.size > VALIDATION.maxFileSize) {
      warnings.push(`File size (${formatBytes(stats.size)}) exceeds recommended maximum (${formatBytes(VALIDATION.maxFileSize)})`);
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!VALIDATION.supportedExtensions.includes(ext)) {
      errors.push(`Unsupported file extension: ${ext}`);
    }
    
    // Basic MIME type check by reading file header
    const mimeType = await detectVideoMimeType(filePath);
    if (mimeType && !isVideoMimeType(mimeType)) {
      errors.push(`File does not appear to be a video: ${mimeType}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        size: stats.size,
        extension: ext,
        mimeType,
      },
    };
    
  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Detect MIME type by reading file signature
 * @param {string} filePath - Path to file
 * @returns {Promise<string|null>} Detected MIME type
 */
async function detectVideoMimeType(filePath) {
  const buffer = Buffer.alloc(12);
  const fd = await fs.open(filePath, 'r');
  
  try {
    await fs.read(fd, buffer, 0, 12, 0);
    
    // Check common video file signatures
    const signatures = {
      '66747970': 'video/mp4',     // ftyp (MP4)
      '000001BA': 'video/mpeg',     // MPEG
      '000001B3': 'video/mpeg',     // MPEG
      '52494646': 'video/avi',      // RIFF (AVI)
      '1A45DFA3': 'video/webm',     // WebM
      '3026B275': 'video/x-ms-wmv', // WMV
      '464C5601': 'video/x-flv',    // FLV
    };
    
    const hex = buffer.toString('hex').toUpperCase();
    
    // Check each signature
    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (hex.startsWith(signature)) {
        return mimeType;
      }
    }
    
    // Special case for MP4/MOV files
    if (hex.substring(8, 16) === '66747970') {
      return 'video/mp4';
    }
    
    return null;
    
  } finally {
    await fs.close(fd);
  }
}

/**
 * Check if MIME type is a video type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if video MIME type
 */
function isVideoMimeType(mimeType) {
  return mimeType && mimeType.startsWith('video/');
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Validate encoding options
 * @param {Object} options - Encoding options
 * @returns {Object} Validation result
 */
export function validateEncodingOptions(options) {
  const errors = [];
  const warnings = [];
  
  // Validate output directory
  if (options.outputDir && !path.isAbsolute(options.outputDir)) {
    warnings.push('Output directory should be an absolute path');
  }
  
  // Validate quality settings
  if (options.crf !== undefined) {
    if (options.crf < 0 || options.crf > 51) {
      errors.push('CRF value must be between 0 and 51');
    }
  }
  
  // Validate preset
  const validPresets = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'];
  if (options.preset && !validPresets.includes(options.preset)) {
    errors.push(`Invalid preset: ${options.preset}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}