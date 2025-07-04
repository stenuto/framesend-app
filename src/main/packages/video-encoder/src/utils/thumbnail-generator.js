import { execa } from 'execa';
import path from 'path';
import fs from 'fs-extra';
import sharp from 'sharp';

/**
 * Extract thumbnails from video
 * @param {string} inputPath - Input video path
 * @param {string} outputPath - Output image path
 * @param {Object} options - Thumbnail options
 * @returns {Promise<Object>} Thumbnail metadata
 */
export async function extractThumbnails(inputPath, outputPath, options = {}) {
  const ffmpegPath = options.ffmpegPath || 'ffmpeg';
  
  if (options.sprite) {
    // Generate storyboard sprite
    return await generateStoryboardSprite(inputPath, outputPath, options);
  } else {
    // Extract single thumbnail
    return await extractSingleThumbnail(inputPath, outputPath, options);
  }
}

/**
 * Extract a single thumbnail at specified time
 * @private
 */
async function extractSingleThumbnail(inputPath, outputPath, options) {
  const ffmpegPath = options.ffmpegPath || 'ffmpeg';
  
  // Calculate seek time
  let seekTime = '00:00:01'; // Default 1 second
  if (options.time) {
    if (typeof options.time === 'string' && options.time.endsWith('%')) {
      // Percentage-based seeking requires duration
      const duration = options.duration || await getVideoDuration(inputPath, ffmpegPath);
      const percentage = parseFloat(options.time) / 100;
      const seconds = duration * percentage;
      seekTime = formatTime(seconds);
    } else {
      seekTime = options.time;
    }
  }
  
  const args = [
    '-ss', seekTime,        // Seek to time
    '-i', inputPath,        // Input file
    '-vframes', '1',        // Extract one frame
    '-q:v', '2',           // High quality
  ];
  
  // Add scaling if width specified
  if (options.width) {
    args.push('-vf', `scale=${options.width}:-1`);
  }
  
  args.push('-y', outputPath);
  
  await execa(ffmpegPath, args);
  
  // Apply additional processing if needed
  if (options.quality && options.quality < 100) {
    await sharp(outputPath)
      .jpeg({ quality: options.quality })
      .toFile(outputPath + '.tmp');
    
    await fs.move(outputPath + '.tmp', outputPath, { overwrite: true });
  }
  
  return {
    path: outputPath,
    time: seekTime,
    width: options.width,
  };
}

/**
 * Generate a storyboard sprite with multiple thumbnails
 * @private
 */
async function generateStoryboardSprite(inputPath, outputPath, options) {
  const ffmpegPath = options.ffmpegPath || 'ffmpeg';
  const tempDir = path.join(path.dirname(outputPath), 'temp_thumbs_' + Date.now());
  
  await fs.ensureDir(tempDir);
  
  try {
    const interval = options.interval || 10; // Every 10 seconds
    const duration = options.duration || await getVideoDuration(inputPath, ffmpegPath);
    const thumbnailCount = Math.floor(duration / interval);
    
    // Extract frames at intervals
    const framePromises = [];
    for (let i = 0; i < thumbnailCount; i++) {
      const time = i * interval;
      const framePath = path.join(tempDir, `thumb_${i.toString().padStart(4, '0')}.jpg`);
      
      const args = [
        '-ss', formatTime(time),
        '-i', inputPath,
        '-vframes', '1',
        '-vf', `scale=${options.width}:${options.height}`,
        '-q:v', '5',
        '-y', framePath
      ];
      
      framePromises.push(execa(ffmpegPath, args).then(() => framePath));
    }
    
    const framePaths = await Promise.all(framePromises);
    
    // Create sprite sheet using sharp
    const columns = options.columns || 10;
    const rows = Math.ceil(thumbnailCount / columns);
    const spriteWidth = options.width * columns;
    const spriteHeight = options.height * rows;
    
    // Create composite operations
    const composites = [];
    for (let i = 0; i < framePaths.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      composites.push({
        input: framePaths[i],
        left: col * options.width,
        top: row * options.height,
      });
    }
    
    // Create sprite
    await sharp({
      create: {
        width: spriteWidth,
        height: spriteHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    })
      .composite(composites)
      .jpeg({ quality: options.quality || 70 })
      .toFile(outputPath);
    
    // Clean up temp files
    await fs.remove(tempDir);
    
    return {
      path: outputPath,
      interval,
      count: thumbnailCount,
      columns,
      rows,
      thumbnailWidth: options.width,
      thumbnailHeight: options.height,
      spriteWidth,
      spriteHeight,
    };
    
  } catch (error) {
    // Clean up on error
    await fs.remove(tempDir).catch(() => {});
    throw error;
  }
}

/**
 * Get video duration using ffprobe
 * @private
 */
async function getVideoDuration(inputPath, ffmpegPath) {
  const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
  
  const args = [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    inputPath
  ];
  
  const { stdout } = await execa(ffprobePath, args);
  return parseFloat(stdout);
}

/**
 * Format seconds to HH:MM:SS
 * @private
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Extract I-frames for trick play
 * @param {string} inputPath - Input video path
 * @param {string} outputDir - Output directory for I-frames
 * @param {Object} options - Extraction options
 */
export async function extractIFrames(inputPath, outputDir, options = {}) {
  const ffmpegPath = options.ffmpegPath || 'ffmpeg';
  
  await fs.ensureDir(outputDir);
  
  // Extract I-frames as separate images
  const args = [
    '-i', inputPath,
    '-vf', `select='eq(pict_type\\,I)',scale=${options.width || 320}:-1`,
    '-vsync', 'vfr',
    '-q:v', '3',
    path.join(outputDir, 'iframe_%04d.jpg')
  ];
  
  await execa(ffmpegPath, args);
  
  // Get list of extracted frames
  const files = await fs.readdir(outputDir);
  const iframes = files
    .filter(f => f.startsWith('iframe_'))
    .sort()
    .map(f => path.join(outputDir, f));
  
  return {
    count: iframes.length,
    files: iframes,
  };
}