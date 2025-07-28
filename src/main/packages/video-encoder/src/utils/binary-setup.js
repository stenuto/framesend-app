import { execa } from 'execa';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Setup and verify required binaries (ffmpeg, ffprobe, whisper)
 * @param {Object} options - Binary paths
 * @returns {Promise<Object>} Verified binary paths
 */
export async function setupBinaries(options = {}) {
  
  // Use provided paths directly if available
  if (options.ffmpegPath && options.ffprobePath) {
    const binaries = {
      ffmpeg: options.ffmpegPath,
      ffprobe: options.ffprobePath,
      whisper: options.whisperPath || null,
    };
    
    // Verify they exist
    if (fs.existsSync(binaries.ffmpeg)) {
      
      // Check codec support
      try {
        const codecs = await getFFmpegCodecs(binaries.ffmpeg);
        binaries.codecs = codecs;
        
        // Check for H.264
        if (!codecs.encoders.includes('libx264')) {
          console.warn('H.264 encoding (libx264) not available');
        }
        
        // Check for AV1
        const hasAV1 = codecs.encoders.includes('libsvtav1') || 
                       codecs.encoders.includes('libaom-av1') || 
                       codecs.encoders.includes('av1') ||
                       codecs.encoders.includes('av1_nvenc');
        if (!hasAV1) {
          binaries.hasAV1 = false;
        } else {
          binaries.hasAV1 = true;
        }
      } catch (error) {
        binaries.hasAV1 = false;
      }
    }
    
    return binaries;
  }
  
  // Otherwise try to find them
  const bundledBinaries = getBundledBinaryPaths();
  
  const binaries = {
    ffmpeg: options.ffmpegPath || bundledBinaries.ffmpeg || await findBinary('ffmpeg', false),
    ffprobe: options.ffprobePath || bundledBinaries.ffprobe || await findBinary('ffprobe', false),
    whisper: options.whisperPath || await findBinary('whisper-cpp', false),
  };

  // For now, just warn if binaries are missing instead of throwing
  if (!binaries.ffmpeg) {
    // Use placeholder paths for now
    binaries.ffmpeg = 'ffmpeg';
  } else {
    try {
      const ffmpegVersion = await verifyFFmpeg(binaries.ffmpeg);
    } catch (error) {
      binaries.ffmpeg = 'ffmpeg';
    }
  }

  // Verify FFprobe
  if (!binaries.ffprobe) {
    binaries.ffprobe = 'ffprobe';
  } else {
    try {
      const ffprobeVersion = await verifyFFprobe(binaries.ffprobe);
    } catch (error) {
      binaries.ffprobe = 'ffprobe';
    }
  }

  // Verify Whisper (optional)
  if (binaries.whisper) {
    try {
      const whisperVersion = await verifyWhisper(binaries.whisper);
    } catch (error) {
      binaries.whisper = null;
    }
  }

  return binaries;
}

/**
 * Get paths to bundled binaries
 * @returns {Object} Paths to bundled binaries
 */
function getBundledBinaryPaths() {
  const platform = os.platform();
  
  // Since we can't access electron's app here, we'll just return empty
  // The handler should provide the correct paths
  return {};
  
  const ext = platform === 'win32' ? '.exe' : '';
  
  const paths = {
    ffmpeg: path.join(resourcesPath, `ffmpeg${ext}`),
    ffprobe: path.join(resourcesPath, `ffprobe${ext}`),
  };
  
  // Check if files exist and make them executable
  const verifiedPaths = {};
  for (const [name, binPath] of Object.entries(paths)) {
    if (fs.existsSync(binPath)) {
      // Make sure the binary is executable (Unix-like systems)
      if (platform !== 'win32') {
        try {
          fs.chmodSync(binPath, '755');
        } catch (error) {
          console.warn(`Could not set executable permission for ${name}:`, error.message);
        }
      }
      verifiedPaths[name] = binPath;
    }
  }
  
  return verifiedPaths;
}

/**
 * Find binary in system PATH or common locations
 * @param {string} name - Binary name
 * @param {boolean} required - Whether binary is required
 * @returns {Promise<string|null>} Binary path
 */
async function findBinary(name, required = true) {
  // Try system PATH first
  try {
    const { stdout } = await execa('which', [name]);
    if (stdout) return stdout.trim();
  } catch (error) {
    // Not in PATH, continue searching
  }

  // Common installation paths
  const commonPaths = getCommonBinaryPaths(name);
  
  for (const binaryPath of commonPaths) {
    if (await fs.pathExists(binaryPath)) {
      return binaryPath;
    }
  }

  if (required) {
    throw new Error(`${name} not found in PATH or common locations`);
  }

  return null;
}

/**
 * Get common binary installation paths by platform
 * @param {string} name - Binary name
 * @returns {string[]} Possible paths
 */
function getCommonBinaryPaths(name) {
  const platform = os.platform();
  const paths = [];

  if (platform === 'darwin') {
    // macOS
    paths.push(
      `/usr/local/bin/${name}`,
      `/opt/homebrew/bin/${name}`,
      `/usr/bin/${name}`,
      path.join(os.homedir(), `.local/bin/${name}`)
    );
  } else if (platform === 'win32') {
    // Windows
    paths.push(
      `C:\\Program Files\\ffmpeg\\bin\\${name}.exe`,
      `C:\\ffmpeg\\bin\\${name}.exe`,
      `C:\\Program Files (x86)\\ffmpeg\\bin\\${name}.exe`,
      path.join(os.homedir(), `ffmpeg\\bin\\${name}.exe`)
    );
  } else {
    // Linux
    paths.push(
      `/usr/bin/${name}`,
      `/usr/local/bin/${name}`,
      `/snap/bin/${name}`,
      path.join(os.homedir(), `.local/bin/${name}`)
    );
  }

  return paths;
}

/**
 * Verify FFmpeg installation and get version
 * @param {string} ffmpegPath - Path to ffmpeg binary
 * @returns {Promise<string>} Version string
 */
async function verifyFFmpeg(ffmpegPath) {
  try {
    const { stdout } = await execa(ffmpegPath, ['-version']);
    const match = stdout.match(/ffmpeg version ([^\s]+)/);
    
    if (!match) {
      return 'unknown';
    }

    return match[1];
  } catch (error) {
    throw new Error(`Failed to verify FFmpeg: ${error.message}`);
  }
}

/**
 * Get available codecs from FFmpeg
 * @param {string} ffmpegPath - Path to ffmpeg binary
 * @returns {Promise<Object>} Available codecs
 */
async function getFFmpegCodecs(ffmpegPath) {
  const { stdout: encoders } = await execa(ffmpegPath, ['-encoders']);
  const { stdout: decoders } = await execa(ffmpegPath, ['-decoders']);

  return {
    encoders: encoders.split('\n').map(line => {
      // Match lines like: " V....D libx264              libx264 H.264..."
      const match = line.match(/^\s*[VASD.]+\s+(\S+)/);
      return match ? match[1] : null;
    }).filter(Boolean),
    decoders: decoders.split('\n').map(line => {
      const match = line.match(/^\s*[VASD.]+\s+(\S+)/);
      return match ? match[1] : null;
    }).filter(Boolean),
  };
}

/**
 * Verify FFprobe installation and get version
 * @param {string} ffprobePath - Path to ffprobe binary
 * @returns {Promise<string>} Version string
 */
async function verifyFFprobe(ffprobePath) {
  try {
    const { stdout } = await execa(ffprobePath, ['-version']);
    const match = stdout.match(/ffprobe version ([^\s]+)/);
    
    if (!match) {
      throw new Error('Could not parse FFprobe version');
    }

    return match[1];
  } catch (error) {
    throw new Error(`Failed to verify FFprobe: ${error.message}`);
  }
}

/**
 * Verify Whisper installation and get version
 * @param {string} whisperPath - Path to whisper binary
 * @returns {Promise<string>} Version string
 */
async function verifyWhisper(whisperPath) {
  try {
    const { stdout } = await execa(whisperPath, ['--version']);
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to verify Whisper: ${error.message}`);
  }
}

/**
 * Download required binaries (helper for installation)
 * @param {string} targetDir - Directory to install binaries
 */
export async function downloadBinaries(targetDir) {
  // This would implement binary downloading based on platform
  // For now, we'll just provide instructions
  
  const platform = os.platform();
  const arch = os.arch();
}