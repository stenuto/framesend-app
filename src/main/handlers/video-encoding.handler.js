import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { globalProcessManager } from '../packages/video-encoder/src/utils/global-process-manager.js';
import FFmpegKiller from '../utils/ffmpeg-killer.js';
import ProcessFinder from '../utils/process-finder.js';
import SimpleKiller from '../utils/simple-killer.js';
import RobustKiller from '../utils/robust-killer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import for the video encoder package
let VideoEncodingService, validateVideoFile;

// Initialize encoding service as singleton
let encodingService = null;

/**
 * Register video encoding IPC handlers
 */
export default async function registerVideoHandlers(ipcMain, { app }) {
  
  // Load the video encoder modules
  try {
    // Use file URL for proper ESM imports
    const encoderPath = new URL('../packages/video-encoder/src/index.js', import.meta.url).href;
    const validationPath = new URL('../packages/video-encoder/src/utils/validation.js', import.meta.url).href;
    
    
    const encoderModule = await import(encoderPath);
    const validationModule = await import(validationPath);
    
    VideoEncodingService = encoderModule.VideoEncodingService;
    validateVideoFile = validationModule.validateVideoFile;
    
  } catch (error) {
    console.error('Failed to load video encoder modules:', error);
    console.error('Stack:', error.stack);
    
    // Provide a basic validation function if loading fails
    validateVideoFile = async (filePath) => {
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return { isValid: false, errors: ['File does not exist'], warnings: [] };
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mpg', '.mpeg', '.wmv', '.flv'];
      
      return {
        isValid: videoExtensions.includes(ext),
        errors: videoExtensions.includes(ext) ? [] : ['Invalid file type'],
        warnings: [],
        fileInfo: {
          extension: ext
        }
      };
    };
  }

  /**
   * Get or create the encoding service instance
   */
  async function getEncodingService() {
    if (!encodingService) {
      // Get paths to bundled binaries
      const isPackaged = app.isPackaged;
      let resourcesPath;
      
      if (isPackaged) {
        resourcesPath = process.resourcesPath;
      } else {
        // In development, use app.getAppPath() to get the correct base path
        const appPath = app.getAppPath();
        resourcesPath = path.join(appPath, 'resources');
      }
      
      const ffmpegPath = path.join(resourcesPath, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
      const ffprobePath = path.join(resourcesPath, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
      
      
      // Verify binaries exist
      if (!fs.existsSync(ffmpegPath)) {
        console.error('FFmpeg binary not found at:', ffmpegPath);
      }
      if (!fs.existsSync(ffprobePath)) {
        console.error('FFprobe binary not found at:', ffprobePath);
      }
      
      encodingService = new VideoEncodingService({
        outputDir: path.join(app.getPath('userData'), 'encoded-videos'),
        tempDir: path.join(app.getPath('userData'), 'temp', 'framesend-encoding'),
        maxParallelJobs: 1,
        ffmpegPath,
        ffprobePath,
      });
      
      // Wait for initialization to complete
      await new Promise((resolve, reject) => {
        encodingService.once('ready', () => {
          resolve();
        });
        
        encodingService.once('error', (error) => {
          console.error('[getEncodingService] Service initialization error:', error);
          reject(error);
        });
        
        // Add timeout
        setTimeout(() => {
          reject(new Error('Service initialization timeout'));
        }, 10000); // 10 second timeout
      });
      
      // Add error listener for ongoing errors
      encodingService.on('job:error', (data) => {
        console.error('Job error:', data);
      });
    }
    
    return encodingService;
  }
  
  /**
   * Validate a video file
   * Returns validation result with file info
   */
  ipcMain.handle('video:validate', async (event, filePath) => {
    try {
      // Make sure validateVideoFile is loaded
      if (!validateVideoFile) {
        throw new Error('Video validation not initialized');
      }
      
      const validation = await validateVideoFile(filePath);
      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * Batch validate multiple video files
   * Returns array of validation results
   */
  ipcMain.handle('video:validateBatch', async (event, filePaths) => {
    try {
      // Make sure validateVideoFile is loaded
      if (!validateVideoFile) {
        throw new Error('Video validation not initialized');
      }
      
      // Validate files in parallel
      const validationPromises = filePaths.map(async (filePath) => {
        try {
          const validation = await validateVideoFile(filePath);
          return {
            filePath,
            success: true,
            data: validation
          };
        } catch (error) {
          return {
            filePath,
            success: false,
            error: error.message
          };
        }
      });
      
      const results = await Promise.all(validationPromises);
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Batch validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * Queue a video for encoding
   * Returns job information
   */
  ipcMain.handle('video:encode', async (event, { filePath, options = {} }) => {
    try {
      const service = await getEncodingService();
      
      // Queue the video
      const job = await service.queueVideo(filePath, options);
      
      // Set up event forwarding for this job
      const startHandler = (data) => {
        if (data.jobId === job.id) {
          event.sender.send('encoding:start', data);
        }
      };
      
      const progressHandler = (progress) => {
        if (progress.jobId === job.id) {
          event.sender.send('encoding:progress', progress);
        }
      };
      
      const completeHandler = (result) => {
        if (result.jobId === job.id) {
          event.sender.send('encoding:complete', result);
          // Clean up listeners
          service.off('job:progress', progressHandler);
          service.off('job:complete', completeHandler);
          service.off('job:error', errorHandler);
        }
      };
      
      const errorHandler = (error) => {
        if (error.jobId === job.id) {
          event.sender.send('encoding:error', {
            ...error,
            message: error.message,
            stage: error.stage,
            stack: error.stack
          });
          // Clean up listeners
          service.off('job:start', startHandler);
          service.off('job:progress', progressHandler);
          service.off('job:complete', completeHandler);
          service.off('job:error', errorHandler);
          service.off('job:cancelled', cancelledHandler);
        }
      };
      
      const cancelledHandler = (data) => {
        if (data.jobId === job.id) {
          event.sender.send('encoding:cancelled', data);
          // Clean up listeners
          service.off('job:start', startHandler);
          service.off('job:progress', progressHandler);
          service.off('job:complete', completeHandler);
          service.off('job:error', errorHandler);
          service.off('job:cancelled', cancelledHandler);
        }
      };
      
      // Listen for job events
      service.on('job:start', startHandler);
      service.on('job:progress', progressHandler);
      service.on('job:complete', completeHandler);
      service.on('job:error', errorHandler);
      service.on('job:cancelled', cancelledHandler);
      
      return {
        success: true,
        data: {
          id: job.id,
          filePath,
        },
      };
    } catch (error) {
      console.error('[video:encode] Handler error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * Cancel an encoding job
   */
  ipcMain.handle('video:cancel', async (event, jobId) => {
    console.log(`[video:cancel] Received cancel request for job ${jobId}`);
    
    try {
      // Try the proper way first - cancel through the service
      // This will now use fluent-ffmpeg's kill method
      const service = await getEncodingService();
      await service.cancelJob(jobId);
      
      console.log(`[video:cancel] Job ${jobId} cancelled through service`);
      
      // Also use robust killer to ensure processes are killed
      console.log(`[video:cancel] Using RobustKiller to ensure processes are killed`);
      const killedCount = await RobustKiller.killJobProcesses(jobId);
      console.log(`[video:cancel] RobustKiller killed ${killedCount} additional processes`);
      
      return {
        success: true,
        killedCount,
      };
    } catch (error) {
      console.error(`[video:cancel] Service cancel failed for job ${jobId}:`, error);
      
      // Try robust killer as fallback
      console.log(`[video:cancel] Trying RobustKiller as fallback`);
      try {
        const killedCount = await RobustKiller.killJobProcesses(jobId);
        console.log(`[video:cancel] RobustKiller killed ${killedCount} processes`);
        
        return {
          success: true,
          killedCount,
          fallback: true,
        };
      } catch (killError) {
        console.error(`[video:cancel] RobustKiller also failed:`, killError);
        return {
          success: false,
          error: error.message,
        };
      }
    }
  });

  /**
   * Get encoding queue status
   */
  ipcMain.handle('video:status', async (event) => {
    try {
      const service = await getEncodingService();
      const status = service.getStatus();
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * Pause encoding queue
   */
  ipcMain.handle('video:pause', async (event) => {
    try {
      const service = await getEncodingService();
      service.pause();
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * Resume encoding queue
   */
  ipcMain.handle('video:resume', async (event) => {
    try {
      const service = await getEncodingService();
      service.resume();
      
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  /**
   * Select video files
   */
  ipcMain.handle('video:selectFiles', async () => {
    const { dialog } = await import('electron');
    
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkk', 'webm', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
      size: fs.statSync(filePath).size
    }));
  });
  
  /**
   * Test fluent-ffmpeg kill
   */
  ipcMain.handle('video:testKill', async () => {
    console.log('[video:testKill] Running fluent-ffmpeg kill test');
    
    const ffmpeg = require('fluent-ffmpeg');
    const path = require('path');
    
    // Get paths to bundled binaries
    const resourcesPath = app.getAppPath();
    const ffmpegPath = path.join(resourcesPath, 'resources', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    
    ffmpeg.setFfmpegPath(ffmpegPath);
    
    // Create a simple ffmpeg command
    const command = ffmpeg()
      .input('/dev/zero')
      .inputFormat('lavfi')
      .inputOptions('-t 30')
      .output('/dev/null')
      .outputFormat('null')
      .on('start', (cmd) => {
        console.log('[video:testKill] Started test command:', cmd);
      })
      .on('error', (err) => {
        console.log('[video:testKill] Command error:', err.message);
      })
      .on('end', () => {
        console.log('[video:testKill] Command ended normally');
      });
    
    // Start the command
    command.run();
    
    // Wait a moment then try to kill it
    setTimeout(() => {
      console.log('[video:testKill] Attempting to kill command...');
      console.log('[video:testKill] Command has kill method:', typeof command.kill);
      console.log('[video:testKill] Command has ffmpegProc:', !!command.ffmpegProc);
      
      if (command.ffmpegProc) {
        console.log('[video:testKill] Process PID:', command.ffmpegProc.pid);
      }
      
      command.kill('SIGKILL');
      console.log('[video:testKill] Kill signal sent');
    }, 2000);
    
    return { success: true, message: 'Test started - check logs' };
  });
  
  /**
   * Force kill processes for a job (direct approach)
   */
  ipcMain.handle('video:forceKill', async (event, jobId) => {
    console.log(`[video:forceKill] Force killing processes for job ${jobId}`);
    
    try {
      let totalKilled = 0;
      
      // First try the ProcessFinder which uses lsof to find processes by directory
      const finderKilled = await ProcessFinder.killJobProcesses(jobId);
      totalKilled += finderKilled;
      console.log(`[video:forceKill] ProcessFinder killed ${finderKilled} processes`);
      
      // Then try the direct FFmpeg killer
      const directKilled = await FFmpegKiller.killByJobId(jobId);
      totalKilled += directKilled;
      console.log(`[video:forceKill] Direct killer killed ${directKilled} processes`);
      
      // Then try the global process manager
      const managerKilled = await globalProcessManager.killJobProcesses(jobId);
      totalKilled += managerKilled;
      console.log(`[video:forceKill] Global manager killed ${managerKilled} processes`);
      
      // Finally try the service cancel
      try {
        const service = await getEncodingService();
        await service.cancelJob(jobId);
      } catch (e) {
        console.log('[video:forceKill] Service cancel failed (job might not exist):', e.message);
      }
      
      return {
        success: true,
        killedCount: totalKilled
      };
    } catch (error) {
      console.error('[video:forceKill] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  /**
   * Emergency stop all encoding
   */
  ipcMain.handle('video:emergencyStop', async (event) => {
    console.log('[video:emergencyStop] Emergency stop requested!');
    
    try {
      let totalKilled = 0;
      
      // First use RobustKiller for all app FFmpeg processes
      const robustKilled = await RobustKiller.killAllAppFFmpeg();
      totalKilled += robustKilled;
      console.log(`[video:emergencyStop] RobustKiller killed ${robustKilled} processes`);
      
      // Then use global manager
      const managerKilled = globalProcessManager.killAllProcesses();
      totalKilled += managerKilled;
      console.log(`[video:emergencyStop] Global manager killed ${managerKilled} processes`);
      
      // Also try to cleanup the service
      if (encodingService) {
        await encodingService.cleanup();
      }
      
      return {
        success: true,
        killedCount: totalKilled
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  /**
   * Get process manager status (for debugging)
   */
  ipcMain.handle('video:processStatus', async (event) => {
    const managerStatus = globalProcessManager.getStatus();
    const runningProcesses = await RobustKiller.getRunningFFmpegInfo();
    
    return {
      success: true,
      data: {
        manager: managerStatus,
        running: runningProcesses,
        summary: {
          totalRunning: runningProcesses.length,
          ourProcesses: runningProcesses.filter(p => p.isOurs).length
        }
      }
    };
  });
  
  /**
   * Clean up on app quit
   */
  app.on('before-quit', async () => {
    // Kill all processes before quitting
    globalProcessManager.killAllProcesses();
    
    if (encodingService) {
      await encodingService.destroy();
    }
  });
  
  console.log('Video encoding handlers registered successfully');
}