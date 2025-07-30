import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs-extra';
import PQueue from 'p-queue';
import { 
  H264_LADDER,
  AV1_LADDER,
  PROGRESS_WEIGHTS,
  RESOURCE_LIMITS,
  H264_ENCODING_PARAMS,
  HLS_PARAMS,
  AUDIO_PARAMS,
  THUMBNAIL_PARAMS,
  AV1_CONFIG,
  calculateBitrate,
  mapQualityToCRF,
  mapQualityToBitrateMultiplier,
} from '../config/encoding-presets.js';
import { filterLadderBySettings } from '../utils/settings-loader.js';
import { ProgressTracker } from '../utils/progress-tracker.js';
import { FluentFFmpegWrapper } from '../utils/fluent-ffmpeg-wrapper.js';
import { generateHLSManifest } from '../utils/hls-manifest.js';
import { extractThumbnails } from '../utils/thumbnail-generator.js';
import { getDirectorySize } from '../utils/directory-size.js';

/**
 * Represents a single video encoding job
 * Handles the complete encoding pipeline from probe to finalization
 */
export class VideoJob extends EventEmitter {
  constructor(options) {
    super();
    
    this.id = options.id;
    this.inputPath = options.inputPath;
    this.outputDir = options.outputDir;
    this.tempDir = options.tempDir;
    this.binaries = options.binaries;
    this.encodingSettings = options.encodingSettings;
    
    // Job state
    this.status = 'pending';
    this.metadata = {};
    this.renditions = [];
    this.cancelled = false;
    this.encodedSize = 0; // Track encoded size in bytes
    this.lastSizeCheck = 0; // Last time we checked the size
    
    // Initialize progress tracker
    this.progressTracker = new ProgressTracker(PROGRESS_WEIGHTS);
    this.progressTracker.on('update', async (progress) => {
      // Update encoded size before emitting progress
      await this._updateEncodedSize();
      // Always emit progress with encoded size
      this.progress = { ...progress, encodedSize: this.encodedSize };
      this.emit('progress', this.progress);
    });
    
    // Initialize FFmpeg wrapper with job ID for tracking
    this.ffmpeg = new FluentFFmpegWrapper(this.binaries, this.id);
    
    // Encoding queue for parallel processing
    this.encodingQueue = new PQueue({ 
      concurrency: RESOURCE_LIMITS.maxFFmpegProcesses,
    });
    
    // Setup directories
    this._setupDirectories();
  }

  /**
   * Create required directories for the job
   */
  async _setupDirectories() {
    await fs.ensureDir(this.outputDir);
    await fs.ensureDir(this.tempDir);
    await fs.ensureDir(path.join(this.outputDir, 'renditions', 'h264'));
    await fs.ensureDir(path.join(this.outputDir, 'renditions', 'av1'));
    await fs.ensureDir(path.join(this.outputDir, 'audio'));
    await fs.ensureDir(path.join(this.outputDir, 'thumbnails'));
    await fs.ensureDir(path.join(this.outputDir, 'captions'));
  }

  /**
   * Main encoding pipeline
   */
  async encode() {
    try {
      this.status = 'processing';
      this.startTime = Date.now();

      // Stage 1: Probe video metadata
      await this._probe();
      
      // Stage 2: Generate hero thumbnail immediately for UI feedback
      await this._generateHeroThumbnail();
      
      // Stage 3: Plan encoding renditions
      await this._planRenditions();
      
      // Stage 4: Extract audio
      await this._extractAudio();
      
      // Stage 5: Encode video streams
      await this._encodeStreams();
      
      // Stage 6: Generate storyboard (separate from hero thumbnail)
      await this._generateStoryboard();
      
      // Stage 7: Generate captions (if whisper is available)
      await this._genCaptions();
      
      // Stage 8: Generate HLS manifests
      await this._genManifest();
      
      // Stage 9: Write metadata
      await this._writeMetadata();
      
      // Stage 10: Finalize
      await this._finalize();
      
      this.status = 'complete';
      this.emit('complete', {
        metadata: this.metadata,
        duration: Date.now() - this.startTime,
      });
      
      return this.metadata;
      
    } catch (error) {
      console.error(`[VideoJob ${this.id}] Encode error:`, error.message);
      this.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stage 1: Probe video file for metadata
   */
  async _probe() {
    this.progressTracker.startStage('probe');
    
    try {
      const probeData = await this.ffmpeg.probe(this.inputPath);
      
      // Extract relevant metadata
      const videoStream = probeData.streams.find(s => s.codec_type === 'video');
      const audioStream = probeData.streams.find(s => s.codec_type === 'audio');
      
      this.metadata = {
        id: this.id,
        duration: parseFloat(probeData.format.duration),
        size: parseInt(probeData.format.size),
        bitrate: parseInt(probeData.format.bit_rate),
        hlsSegmentDuration: HLS_PARAMS.hls_time, // Store HLS segment duration
        
        video: {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          frameRate: eval(videoStream.r_frame_rate), // e.g., "30/1" -> 30
          bitRate: parseInt(videoStream.bit_rate || 0),
          pixelFormat: videoStream.pix_fmt,
          colorSpace: videoStream.color_space,
          colorPrimaries: videoStream.color_primaries,
          colorTransfer: videoStream.color_transfer,
          aspectRatio: `${videoStream.width}:${videoStream.height}`,
        },
        
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          channelLayout: audioStream.channel_layout,
          sampleRate: parseInt(audioStream.sample_rate),
          bitRate: parseInt(audioStream.bit_rate || 0),
        } : null,
      };
      
      this.progressTracker.completeStage('probe');
      
    } catch (error) {
      throw new Error(`Probe failed: ${error.message}`);
    }
  }

  /**
   * Stage 2: Generate hero thumbnail immediately for UI feedback
   */
  async _generateHeroThumbnail() {
    this.progressTracker.startStage('assets');
    
    try {
      const aspectRatio = this.metadata.video.width / this.metadata.video.height;
      
      // Generate hero thumbnail maintaining aspect ratio
      const heroPath = path.join(this.outputDir, 'thumbnails', 'hero_4k.jpg');
      await extractThumbnails(
        this.inputPath,
        heroPath,
        {
          ...THUMBNAIL_PARAMS.hero,
          ffmpegPath: this.binaries.ffmpeg,
          duration: this.metadata.duration, // Pass duration for percentage-based seeking
        }
      );
      
      // Emit event for immediate UI update with a small delay to ensure file is written
      setTimeout(() => {
        this.emit('thumbnail:ready', {
          jobId: this.id,
          thumbnailPath: heroPath,
          isTemporary: false
        });
      }, 500); // 500ms delay to ensure file is fully written
      
      // Store in metadata
      this.metadata.thumbnails = {
        hero: 'thumbnails/hero_4k.jpg',
      };
      
      
      this.progressTracker.updateStage('assets', 0.5); // Hero thumbnail is 50% of assets stage
      
    } catch (error) {
      console.error(`[VideoJob ${this.id}] Hero thumbnail generation failed:`, error);
      // Continue with encoding even if thumbnail fails
      this.progressTracker.updateStage('assets', 0.5);
    }
  }
  
  /**
   * Format seconds to HH:MM:SS for ffmpeg
   * @private
   */
  _formatTime(seconds) {
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
   * Stage 3: Plan encoding renditions based on source
   */
  async _planRenditions() {
    this.progressTracker.startStage('plan');
    
    const sourceHeight = this.metadata.video.height;
    const sourceWidth = this.metadata.video.width;
    const aspectRatio = sourceWidth / sourceHeight;
    const frameRate = this.metadata.video.frameRate;
    
    // Filter H.264 ladder based on settings and source height
    if (this.encodingSettings.h264.enabled) {
      const enabledH264Ladder = filterLadderBySettings(H264_LADDER, this.encodingSettings.h264);
      
      const h264Renditions = enabledH264Ladder
        .map(rung => {
          // If source is smaller than target, use source dimensions
          const targetHeight = Math.min(rung.height, sourceHeight);
          const width = Math.round(targetHeight * aspectRatio / 2) * 2; // Ensure even number
          
          // Get quality setting (single value for all H.264 renditions)
          const quality = this.encodingSettings.h264.quality || 3;
          const crf = mapQualityToCRF(quality, 'h264');
          const bitrateMultiplier = mapQualityToBitrateMultiplier(quality);
          
          // Calculate bitrate based on actual pixel count and quality multiplier
          const baseConfig = calculateBitrate(width, targetHeight, rung.targetBpp, frameRate);
          const bitrateConfig = {
            maxrate: `${Math.round(parseInt(baseConfig.maxrate) * bitrateMultiplier)}k`,
            bufsize: `${Math.round(parseInt(baseConfig.bufsize) * bitrateMultiplier)}k`,
          };
          
          
          return {
            ...rung,
            codec: 'h264',
            width,
            height: targetHeight,
            ...bitrateConfig,
            crf,
            outputPath: path.join(this.outputDir, 'renditions', 'h264', rung.name),
          };
        });
        
      this.renditions.push(...h264Renditions);
    }
    
    // Add AV1 renditions based on settings
    if (this.encodingSettings.av1.enabled) {
      const enabledAV1Ladder = filterLadderBySettings(AV1_LADDER, this.encodingSettings.av1);
      
      const av1Renditions = enabledAV1Ladder
        .map(rung => {
          // If source is smaller than target, use source dimensions
          const targetHeight = Math.min(rung.height, sourceHeight);
          const width = Math.round(targetHeight * aspectRatio / 2) * 2; // Ensure even number
          
          // Get quality setting (single value for all AV1 renditions)
          const quality = this.encodingSettings.av1.quality || 5;
          const crf = mapQualityToCRF(quality, 'av1');
          const bitrateMultiplier = mapQualityToBitrateMultiplier(quality);
          
          // Calculate bitrate based on actual pixel count and quality multiplier
          const baseConfig = calculateBitrate(width, targetHeight, rung.targetBpp, frameRate);
          const bitrateConfig = {
            maxrate: `${Math.round(parseInt(baseConfig.maxrate) * bitrateMultiplier)}k`,
            bufsize: `${Math.round(parseInt(baseConfig.bufsize) * bitrateMultiplier)}k`,
          };
          
          return {
            ...rung,
            ...AV1_CONFIG,
            width,
            height: targetHeight,
            ...bitrateConfig,
            crf,
            outputPath: path.join(this.outputDir, 'renditions', 'av1', rung.name),
          };
        });
        
      this.renditions.push(...av1Renditions);
    }
    
    // Create output directories for each rendition
    for (const rendition of this.renditions) {
      await fs.ensureDir(rendition.outputPath);
    }
    
    this.progressTracker.completeStage('plan');
  }

  /**
   * Stage 4: Extract audio tracks
   */
  async _extractAudio() {
    this.progressTracker.startStage('audio');
    
    if (!this.metadata.audio) {
      this.progressTracker.completeStage('audio');
      return;
    }
    
    try {
      // Extract default AAC audio (128k)
      const aacPath = path.join(this.outputDir, 'audio', 'default.m4a');
      await this.ffmpeg.extractAudio(this.inputPath, aacPath, {
        ...AUDIO_PARAMS.default,
        encodingSettings: this.encodingSettings
      });
      
      // Also extract upgraded audio (192k) for high-quality renditions
      const upgradedPath = path.join(this.outputDir, 'audio', 'upgraded.m4a');
      await this.ffmpeg.extractAudio(this.inputPath, upgradedPath, {
        ...AUDIO_PARAMS.upgraded,
        encodingSettings: this.encodingSettings
      });
      
      this.metadata.audio.files = {
        default: 'audio/default.m4a',
        upgraded: 'audio/upgraded.m4a',
      };
      
      this.progressTracker.completeStage('audio');
      
    } catch (error) {
      throw new Error(`Audio extraction failed: ${error.message}`);
    }
  }

  /**
   * Stage 5: Encode video streams in parallel
   */
  async _encodeStreams() {
    this.progressTracker.startStage('encode');
    
    const totalRenditions = this.renditions.length;
    let completedRenditions = 0;
    
    // Encode each rendition in parallel (limited by queue concurrency)
    const encodingPromises = this.renditions.map(rendition => 
      this.encodingQueue.add(async () => {
        if (this.cancelled) throw new Error('Job cancelled');
        
        try {
          // Prepare encoding options based on codec
          const encodingOptions = rendition.codec === 'libsvtav1' 
            ? this._getAV1Options(rendition)
            : this._getH264Options(rendition);
          
          // Create HLS playlist for this rendition
          const playlistPath = path.join(rendition.outputPath, 'playlist.m3u8');
          
          // Add segment ready callback to encoding options
          encodingOptions.onSegmentReady = (segmentData) => {
            this._handleSegmentReady({
              ...segmentData,
              rendition: rendition.name,
              codec: rendition.codec || 'h264',
              outputPath: rendition.outputPath
            });
          };
          encodingOptions.renditionName = rendition.name;
          
          // Start encoding with progress callback
          await this.ffmpeg.encodeWithProgress(
            this.inputPath,
            playlistPath,
            encodingOptions,
            async (progress) => {
              // Update progress for this specific rendition
              const renditionProgress = (completedRenditions + progress) / totalRenditions;
              
              // Set detailed rendition info
              this.progressTracker.currentRendition = rendition.name;
              this.progressTracker.renditionProgress = progress;
              
              // Update encoded size during encoding
              await this._updateEncodedSize();
              
              this.progressTracker.updateStage('encode', renditionProgress);
            }
          );
          
          // Store rendition info
          rendition.playlistPath = path.relative(this.outputDir, playlistPath);
          
          completedRenditions++;
          
        } catch (error) {
          throw new Error(`Encoding ${rendition.name} failed: ${error.message}`);
        }
      })
    );
    
    await Promise.all(encodingPromises);
    
    // Clear rendition info
    this.progressTracker.currentRendition = null;
    this.progressTracker.renditionProgress = null;
    
    this.progressTracker.completeStage('encode');
  }

  /**
   * Get H.264 encoding options for a rendition
   */
  _getH264Options(rendition) {
    return {
      ...H264_ENCODING_PARAMS,
      crf: rendition.crf,
      videoFilters: `scale=${rendition.width}:${rendition.height || rendition.targetHeight}`,
      maxrate: rendition.maxrate,
      bufsize: rendition.bufsize,
      profile: rendition.profile,
      level: rendition.level,
      ...HLS_PARAMS,
      hlsSegmentFilename: path.join(rendition.outputPath, 'segment_%04d.m4s'),
      encodingSettings: this.encodingSettings
    };
  }

  /**
   * Get AV1 encoding options for a rendition
   */
  _getAV1Options(rendition) {
    // Build SVT-AV1 parameters string
    const svtav1Params = [];
    if (rendition.svtav1Params) {
      Object.entries(rendition.svtav1Params).forEach(([key, value]) => {
        svtav1Params.push(`${key}=${value}`);
      });
    }
    
    return {
      codec: rendition.codec,
      crf: rendition.crf,
      preset: rendition.preset,
      pixelFormat: rendition.pixelFormat,
      videoFilters: `scale=${rendition.width}:${rendition.height || rendition.targetHeight}`,
      maxrate: rendition.maxrate,
      bufsize: rendition.bufsize,
      // SVT-AV1 specific parameters
      'svtav1-params': svtav1Params.length > 0 ? svtav1Params.join(':') : undefined,
      ...HLS_PARAMS,
      hlsSegmentFilename: path.join(rendition.outputPath, 'segment_%04d.m4s'),
      encodingSettings: this.encodingSettings
    };
  }

  /**
   * Stage 6: Generate storyboard
   */
  async _generateStoryboard() {
    // Continue assets stage from 50%
    
    try {
      const aspectRatio = this.metadata.video.width / this.metadata.video.height;
      
      // Calculate storyboard thumbnail dimensions maintaining aspect ratio
      const storyboardHeight = THUMBNAIL_PARAMS.storyboard.height;
      let storyboardWidth = Math.round(storyboardHeight * aspectRatio / 2) * 2; // Ensure even
      
      // Ensure minimum width
      if (storyboardWidth < 16) {
        storyboardWidth = 16; // Minimum reasonable width
      }
      
      // Generate storyboard sprite (skip if video is too short)
      let storyboardData = null;
      if (this.metadata.duration >= 1) { // Only generate storyboard for videos longer than 1 second
        const storyboardPath = path.join(this.outputDir, 'thumbnails', 'storyboard.jpg');
        try {
          storyboardData = await extractThumbnails(
            this.inputPath,
            storyboardPath,
            {
              ...THUMBNAIL_PARAMS.storyboard,
              width: storyboardWidth,
              height: storyboardHeight,
              duration: this.metadata.duration,
              ffmpegPath: this.binaries.ffmpeg,
              sprite: true,
            }
          );
        } catch (error) {
          console.error(`[VideoJob ${this.id}] Storyboard generation failed:`, error);
          // Continue without storyboard
        }
      }
      
      // Save storyboard metadata if generated
      if (storyboardData) {
        await fs.writeJson(
          path.join(this.outputDir, 'thumbnails', 'storyboard.json'),
          storyboardData,
          { spaces: 2 }
        );
        
        // Update metadata with storyboard
        this.metadata.thumbnails.storyboard = {
          image: 'thumbnails/storyboard.jpg',
          data: 'thumbnails/storyboard.json',
        };
        
        // Emit storyboard ready event
        this.emit('storyboard:ready', {
          storyboardPath: 'thumbnails/storyboard.jpg',
          metadataPath: 'thumbnails/storyboard.json',
          thumbnailCount: storyboardData.thumbnails?.length || 0,
          interval: storyboardData.interval || 0
        });
      }
      
      this.progressTracker.completeStage('assets');
      
    } catch (error) {
      console.error(`[VideoJob ${this.id}] Storyboard generation error:`, error);
      this.progressTracker.completeStage('assets');
    }
  }

  /**
   * Stage 7: Generate captions using Whisper
   */
  async _genCaptions() {
    this.progressTracker.startStage('captions');
    
    // Skip if whisper is not available
    if (!this.binaries.whisper) {
      this.progressTracker.completeStage('captions');
      return;
    }
    
    try {
      // TODO: Implement whisper transcription
      // For now, we'll skip this stage
      
      this.progressTracker.completeStage('captions');
      
    } catch (error) {
      this.progressTracker.completeStage('captions');
    }
  }

  /**
   * Stage 8: Generate HLS master manifest
   */
  async _genManifest() {
    this.progressTracker.startStage('manifest');
    
    try {
      const masterPath = path.join(this.outputDir, 'master.m3u8');
      
      await generateHLSManifest(
        masterPath,
        this.renditions,
        this.metadata
      );
      
      this.metadata.masterPlaylist = 'master.m3u8';
      
      this.progressTracker.completeStage('manifest');
      
    } catch (error) {
      throw new Error(`Manifest generation failed: ${error.message}`);
    }
  }

  /**
   * Stage 9: Write complete metadata file
   */
  async _writeMetadata() {
    this.progressTracker.startStage('metadata');
    
    // Analyze each rendition to get actual bitrates and segment counts
    for (const rendition of this.renditions) {
      try {
        // Get segment count by listing files
        const segmentFiles = await fs.readdir(rendition.outputPath);
        const segments = segmentFiles.filter(f => f.match(/segment_\d+\.(ts|mp4)$/));
        rendition.segmentCount = segments.length;
        
        // Calculate actual bitrate from total segment sizes
        let totalSize = 0;
        for (const segment of segments) {
          const segPath = path.join(rendition.outputPath, segment);
          const segStats = await fs.stat(segPath);
          totalSize += segStats.size;
        }
        
        // Also check for init segment in fMP4
        const initSegment = segmentFiles.find(f => f === 'init.mp4');
        if (initSegment) {
          const initPath = path.join(rendition.outputPath, initSegment);
          const initStats = await fs.stat(initPath);
          totalSize += initStats.size;
        }
        
        // Calculate bitrate: (total bits) / (duration in seconds)
        // totalSize is in bytes, multiply by 8 for bits
        rendition.actualBitrate = Math.round((totalSize * 8) / this.metadata.duration);
        
        // Store additional info that might be useful
        rendition.totalSize = totalSize;
        rendition.averageSegmentSize = segments.length > 0 ? Math.round(totalSize / segments.length) : 0;
        
      } catch (error) {
        rendition.actualBitrate = parseInt(rendition.bitrate.replace('k', '000')); // Convert target to number
        rendition.segmentCount = 0;
        rendition.totalSize = 0;
      }
    }
    
    // Add rendition details with actual values
    this.metadata.renditions = this.renditions.map(r => ({
      name: r.name,
      codec: r.codec || 'h264',
      width: r.width,
      height: r.height,
      targetBitrate: r.bitrate, // Original target (e.g., "2500k")
      actualBitrate: r.actualBitrate || parseInt(r.bitrate.replace('k', '000')), // Actual encoded bitrate in bps
      profile: r.profile,
      level: r.level,
      playlistPath: r.playlistPath,
      segmentCount: r.segmentCount || 0,
      totalSize: r.totalSize || 0, // Total size in bytes
      averageSegmentSize: r.averageSegmentSize || 0, // Average segment size in bytes
      segmentDuration: this.metadata.hlsSegmentDuration || 6, // Segment duration in seconds
    }));
    
    // Add timestamps
    this.metadata.createdAt = new Date().toISOString();
    this.metadata.encodingDuration = Date.now() - this.startTime;
    
    // Write metadata file
    const metadataPath = path.join(this.outputDir, 'metadata.json');
    await fs.writeJson(metadataPath, this.metadata, { spaces: 2 });
    
    this.progressTracker.completeStage('metadata');
  }

  /**
   * Stage 10: Finalize and cleanup
   */
  async _finalize() {
    this.progressTracker.startStage('finalize');
    
    try {
      // Verify all expected files exist
      await this._verifyOutputs();
      
      // Clean up temporary files
      await fs.remove(this.tempDir);
      
      // Calculate total output size
      const stats = await this._calculateOutputSize();
      this.metadata.outputSize = stats.totalSize;
      this.metadata.fileCount = stats.fileCount;
      
      this.progressTracker.completeStage('finalize');
      
    } catch (error) {
      throw new Error(`Finalization failed: ${error.message}`);
    }
  }

  /**
   * Verify all expected output files exist
   */
  async _verifyOutputs() {
    const checks = [
      fs.pathExists(path.join(this.outputDir, 'master.m3u8')),
      fs.pathExists(path.join(this.outputDir, 'metadata.json')),
    ];
    
    // Check each rendition
    for (const rendition of this.renditions) {
      checks.push(fs.pathExists(path.join(this.outputDir, rendition.playlistPath)));
    }
    
    const results = await Promise.all(checks);
    if (results.some(exists => !exists)) {
      throw new Error('Some output files are missing');
    }
  }

  /**
   * Calculate total size of output files
   */
  async _calculateOutputSize() {
    const totalSize = await getDirectorySize(this.outputDir);
    
    // Count files
    let fileCount = 0;
    const countFiles = async (dir) => {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          await countFiles(filePath);
        } else {
          fileCount++;
        }
      }
    };
    
    await countFiles(this.outputDir);
    
    return { totalSize, fileCount };
  }
  
  /**
   * Update the encoded size (throttled to avoid too frequent checks)
   * @private
   */
  async _updateEncodedSize() {
    // Only check size every 2 seconds to avoid performance impact
    const now = Date.now();
    if (now - this.lastSizeCheck < 2000) {
      return;
    }
    
    this.lastSizeCheck = now;
    
    try {
      // Check if output directory exists
      if (await fs.pathExists(this.outputDir)) {
        this.encodedSize = await getDirectorySize(this.outputDir);
      }
    } catch (error) {
      // Ignore errors during size calculation
      console.warn('Failed to calculate encoded size:', error.message);
    }
  }

  /**
   * Handle when an HLS segment is ready
   */
  async _handleSegmentReady(segmentData) {
    try {
      const segmentFullPath = path.join(segmentData.outputPath, segmentData.segmentFile);
      
      // Check if file exists and get its size
      const stats = await fs.stat(segmentFullPath);
      
      // Emit segment ready event with full metadata
      this.emit('segment:ready', {
        jobId: this.id,
        videoId: this.id,
        rendition: segmentData.rendition,
        codec: segmentData.codec,
        segmentNumber: segmentData.segmentNumber,
        segmentFile: segmentData.segmentFile,
        segmentPath: path.relative(this.outputDir, segmentFullPath),
        size: stats.size,
        duration: this.metadata.hlsSegmentDuration || 6,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Ignore errors - segment might not be fully written yet
    }
  }

  /**
   * Cancel the encoding job
   */
  async cancel() {
    this.cancelled = true;
    this.status = 'cancelled';
    
    // Clear encoding queue to prevent new processes from starting
    if (this.encodingQueue) {
      this.encodingQueue.pause();
      this.encodingQueue.clear();
    }
    
    // Kill all FFmpeg processes
    if (this.ffmpeg) {
      await this.ffmpeg.killAll();
    }
    
    // Emit cancelled event immediately
    this.emit('cancelled');
    
    // Clean up files in the background
    setImmediate(async () => {
      try {
        // Wait a moment for processes to fully terminate
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Clean up temporary files
        if (this.tempDir && await fs.pathExists(this.tempDir)) {
          await fs.remove(this.tempDir);
        }
        if (this.outputDir && await fs.pathExists(this.outputDir)) {
          await fs.remove(this.outputDir);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  }
}