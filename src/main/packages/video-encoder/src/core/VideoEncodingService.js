import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { VideoJob } from './VideoJob.js';
import { RESOURCE_LIMITS } from '../config/encoding-presets.js';
import { validateVideoFile } from '../utils/validation.js';
import { setupBinaries } from '../utils/binary-setup.js';
import { loadEncodingSettings } from '../utils/settings-loader.js';

/**
 * Main video encoding service that manages encoding jobs
 * Uses p-queue to control parallel processing and system resources
 */
export class VideoEncodingService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration with defaults
    this.config = {
      outputDir: options.outputDir || path.join(os.homedir(), 'framesend-videos'),
      tempDir: options.tempDir || path.join(os.tmpdir(), 'framesend-encoding'),
      maxParallelJobs: options.maxParallelJobs || RESOURCE_LIMITS.maxParallelJobs,
      ffmpegPath: options.ffmpegPath,
      ffprobePath: options.ffprobePath,
      whisperPath: options.whisperPath,
      ...options,
    };

    // Initialize job queue with concurrency control
    this.jobQueue = new PQueue({ 
      concurrency: this.config.maxParallelJobs,
      intervalCap: 1,
      interval: 1000, // Rate limiting: 1 job per second
    });

    // Track active jobs
    this.activeJobs = new Map();
    
    // Encoding settings - use default for now
    this.encodingSettings = null;
    // Put settings file in the app data directory root
    const appDataDir = path.dirname(this.config.outputDir);
    // Use the main settings.json file instead of encoding-settings.json
    this.settingsPath = path.join(appDataDir, 'settings.json');

    // Setup required directories
    this._setupDirectories();

    // Initialize binary paths and settings
    this._initialize().catch(error => {
      console.error('Initialization error:', error);
    });
  }

  /**
   * Initialize service
   */
  async _initialize() {
    try {
      // Load encoding settings
      this.encodingSettings = await loadEncodingSettings(this.settingsPath);
      
      // Setup binaries
      const binaries = await setupBinaries({
        ffmpegPath: this.config.ffmpegPath,
        ffprobePath: this.config.ffprobePath,
        whisperPath: this.config.whisperPath,
      });
      
      this.binaries = binaries;
      
      // Emit ready asynchronously to avoid issues
      process.nextTick(() => {
        this.emit('ready', { binaries });
      });
    } catch (error) {
      console.error('[VideoEncodingService] Initialization error:', error);
      this.emit('error', {
        type: 'initialization',
        message: 'Failed to initialize encoding service',
        error,
      });
      throw error;
    }
  }

  /**
   * Create required directories
   */
  async _setupDirectories() {
    await fs.ensureDir(this.config.outputDir);
    await fs.ensureDir(this.config.tempDir);
  }

  /**
   * Queue a video for encoding
   * @param {string} inputPath - Path to input video file
   * @param {Object} options - Encoding options
   * @returns {Promise<Object>} Job information
   */
  async queueVideo(inputPath, options = {}) {
    
    // Make sure service is initialized
    if (!this.binaries || !this.encodingSettings) {
      await this._initialize();
    }
    
    // Always reload settings to pick up any changes
    this.encodingSettings = await loadEncodingSettings(this.settingsPath);
    
    // Validate input file
    const validation = await validateVideoFile(inputPath);
    if (!validation.isValid) {
      throw new Error(`Invalid video file: ${validation.errors.join(', ')}`);
    }

    // Generate unique job ID
    const jobId = nanoid();
    
    // Create job output directory
    const jobOutputDir = path.join(this.config.outputDir, jobId);
    await fs.ensureDir(jobOutputDir);

    // Create job instance
    const job = new VideoJob({
      id: jobId,
      inputPath,
      outputDir: jobOutputDir,
      tempDir: path.join(this.config.tempDir, jobId),
      binaries: this.binaries,
      // Merge file-based settings with options-based settings
      encodingSettings: {
        ...this.encodingSettings,
        ...options.encodingSettings
      },
      ...options,
    });

    // Track the job
    this.activeJobs.set(jobId, job);

    // Forward job events
    job.on('progress', (progress) => {
      this.emit('job:progress', { jobId, ...progress });
    });

    job.on('complete', (result) => {
      this.activeJobs.delete(jobId);
      this.emit('job:complete', { jobId, ...result });
    });

    job.on('error', (error) => {
      this.activeJobs.delete(jobId);
      this.emit('job:error', { jobId, error });
    });

    // Add to queue
    const jobPromise = this.jobQueue.add(async () => {
      this.emit('job:start', { 
        jobId, 
        inputPath,
        validation: validation.warnings,
      });
      
      try {
        const result = await job.encode();
        return result;
      } catch (error) {
        console.error(`[VideoEncodingService] Job ${jobId} failed:`, error);
        throw error;
      }
    });

    return {
      id: jobId,
      promise: jobPromise,
      cancel: () => this.cancelJob(jobId),
    };
  }

  /**
   * Cancel an active encoding job
   * @param {string} jobId - Job ID to cancel
   */
  async cancelJob(jobId) {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      await job.cancel();
      
      this.activeJobs.delete(jobId);
      
      this.emit('job:cancelled', { jobId });
    } catch (error) {
      console.error(`[VideoEncodingService] Failed to cancel job ${jobId}:`, error.message);
      this.emit('job:error', { 
        jobId, 
        error: new Error(`Failed to cancel job: ${error.message}`),
      });
      throw error;
    }
  }

  /**
   * Get status of all jobs
   * @returns {Object} Queue and job statistics
   */
  getStatus() {
    return {
      pending: this.jobQueue.pending,
      active: this.jobQueue.size,
      jobs: Array.from(this.activeJobs.entries()).map(([id, job]) => ({
        id,
        status: job.status,
        progress: job.progress,
      })),
    };
  }

  /**
   * Pause all encoding jobs
   */
  pause() {
    this.jobQueue.pause();
    this.emit('paused');
  }

  /**
   * Resume all encoding jobs
   */
  resume() {
    this.jobQueue.start();
    this.emit('resumed');
  }

  /**
   * Clear completed jobs and clean up
   */
  async cleanup() {
    // Clear the queue
    this.jobQueue.clear();

    // Cancel all active jobs
    const cancelPromises = Array.from(this.activeJobs.keys()).map(jobId => 
      this.cancelJob(jobId).catch(err => 
        console.error(`Failed to cancel job ${jobId}:`, err)
      )
    );

    await Promise.all(cancelPromises);

    // Clean up temp directory
    try {
      await fs.emptyDir(this.config.tempDir);
    } catch (error) {
      console.error('Failed to clean temp directory:', error);
    }

    this.emit('cleanup');
  }

  /**
   * Destroy the service and clean up resources
   */
  async destroy() {
    await this.cleanup();
    this.removeAllListeners();
  }
}