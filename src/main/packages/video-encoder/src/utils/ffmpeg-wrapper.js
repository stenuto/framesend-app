import { execa } from 'execa';
import { EventEmitter } from 'events';
import process from 'process';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { ProcessKiller } from './process-killer.js';
import { globalProcessManager } from './global-process-manager.js';

const execAsync = promisify(exec);

/**
 * FFmpeg wrapper for encoding operations
 * Provides a clean interface for FFmpeg/FFprobe commands
 */
export class FFmpegWrapper extends EventEmitter {
  constructor(binaries, jobId = null) {
    super();
    this.ffmpegPath = binaries.ffmpeg || 'ffmpeg';
    this.ffprobePath = binaries.ffprobe || 'ffprobe';
    this.activeProcesses = new Map(); // Changed to Map to store more info
    this.processGroups = new Map(); // Track process groups
    this.jobId = jobId; // Job ID for global tracking
    // Unique identifier for this instance to tag our processes
    this.instanceId = `framesend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Probe video file for metadata
   * @param {string} inputPath - Path to video file
   * @returns {Promise<Object>} Probe data
   */
  async probe(inputPath) {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath
    ];

    try {
      const { stdout } = await execa(this.ffprobePath, args);
      return JSON.parse(stdout);
    } catch (error) {
      throw new Error(`FFprobe failed: ${error.message}`);
    }
  }

  /**
   * Extract audio from video
   * @param {string} inputPath - Input video path
   * @param {string} outputPath - Output audio path
   * @param {Object} options - Audio encoding options
   */
  async extractAudio(inputPath, outputPath, options) {
    const args = [
      '-i', inputPath,
      '-vn', // No video
      '-acodec', options.codec,
      '-ab', options.bitrate,
      '-ac', String(options.channels),
      '-ar', String(options.sampleRate),
      '-y', // Overwrite output
      outputPath
    ];

    const process = execa(this.ffmpegPath, args);
    const processInfo = {
      process,
      pid: process.pid,
      command: 'extractAudio',
      startTime: Date.now()
    };
    this.activeProcesses.set(process.pid, processInfo);
    console.log(`[FFmpeg] Started audio extraction PID: ${process.pid}`);
    
    // Register with global manager if we have a jobId
    if (this.jobId) {
      globalProcessManager.registerProcess(this.jobId, process.pid, {
        command: 'extractAudio',
        path: outputPath
      });
    }

    try {
      await process;
    } finally {
      this.activeProcesses.delete(process.pid);
    }
  }

  /**
   * Encode video with progress tracking
   * @param {string} inputPath - Input video path
   * @param {string} outputPath - Output path
   * @param {Object} options - Encoding options
   * @param {Function} onProgress - Progress callback
   */
  async encodeWithProgress(inputPath, outputPath, options, onProgress) {
    // Build FFmpeg arguments
    const args = this._buildEncodingArgs(inputPath, outputPath, options);

    // Create process with special handling to track all child processes
    const process = execa(this.ffmpegPath, args, {
      detached: false, // Keep in same process group
      cleanup: true
    });
    
    const processInfo = {
      process,
      pid: process.pid,
      command: 'encode',
      outputPath,
      startTime: Date.now(),
      childPids: new Set()
    };
    
    this.activeProcesses.set(process.pid, processInfo);
    console.log(`[FFmpeg] Started encoding process PID: ${process.pid}, Total active: ${this.activeProcesses.size}`);
    
    // Register with global manager if we have a jobId
    if (this.jobId) {
      globalProcessManager.registerProcess(this.jobId, process.pid, {
        command: 'encode',
        path: outputPath
      });
    }
    
    // Track child processes spawned by FFmpeg
    this._trackChildProcesses(process.pid);
    
    // Set up periodic child process tracking
    const childTrackingInterval = setInterval(() => {
      if (this.activeProcesses.has(process.pid)) {
        this._trackChildProcesses(process.pid);
      } else {
        clearInterval(childTrackingInterval);
      }
    }, 1000); // Check every second

    // Track progress through stderr
    let duration = 0;
    process.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Extract duration on first occurrence
      if (!duration) {
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}.\d{2})/);
        if (durationMatch) {
          const [, hours, minutes, seconds] = durationMatch;
          duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        }
      }

      // Extract current time for progress
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}.\d{2})/);
      if (timeMatch && duration) {
        const [, hours, minutes, seconds] = timeMatch;
        const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        const progress = Math.min(currentTime / duration, 1);
        onProgress(progress);
      }
    });

    try {
      await process;
      onProgress(1); // Ensure 100% completion
    } catch (error) {
      // Check if process was killed
      if (error.signal === 'SIGTERM' || error.signal === 'SIGKILL' || error.isCanceled) {
        throw new Error('Encoding cancelled');
      }
      throw new Error(`FFmpeg encoding failed: ${error.message}`);
    } finally {
      // Clean up interval
      clearInterval(childTrackingInterval);
      
      // Clean up process tracking
      const processInfo = this.activeProcesses.get(process.pid);
      if (processInfo && processInfo.childPids && processInfo.childPids.size > 0) {
        console.log(`[FFmpeg] Cleaning up ${processInfo.childPids.size} child processes for PID ${process.pid}`);
      }
      this.activeProcesses.delete(process.pid);
    }
  }

  /**
   * Build FFmpeg encoding arguments
   * @private
   */
  _buildEncodingArgs(inputPath, outputPath, options) {
    const args = [
      '-i', inputPath,
      // Add metadata to identify our processes
      '-metadata', `comment=framesend-app-${this.instanceId}`,
      '-c:v', options.codec || 'libx264',
    ];

    // Video filters (scale, etc.)
    if (options.videoFilters) {
      args.push('-vf', options.videoFilters);
    }

    // H.264 specific options
    if (options.codec === 'libx264' || !options.codec) {
      args.push(
        '-preset', options.preset || 'medium',
        '-crf', String(options.crf || 23),
        '-pix_fmt', options.pixelFormat || 'yuv420p',
        '-profile:v', options.profile || 'main',
        '-level', options.level || '4.0'
      );

      if (options.videoBitrate) {
        args.push('-b:v', options.videoBitrate);
      }
      if (options.maxrate) {
        args.push('-maxrate', options.maxrate);
      }
      if (options.bufsize) {
        args.push('-bufsize', options.bufsize);
      }
      if (options['x264-params']) {
        args.push('-x264-params', options['x264-params']);
      }
    }

    // AV1 specific options
    if (options.codec === 'libsvtav1') {
      // libsvtav1 specific parameters
      args.push(
        '-crf', String(options.crf || 35),
        '-preset', String(options.preset || 8), // SVT-AV1 uses preset (0-13)
        '-pix_fmt', options.pixelFormat || 'yuv420p10le'
      );
      
      // Add SVT-AV1 specific parameters
      if (options['svtav1-params']) {
        args.push('-svtav1-params', options['svtav1-params']);
      }
    } else if (options.codec === 'libaom-av1' || options.codec === 'av1') {
      // libaom-av1 fallback
      args.push(
        '-crf', String(options.crf || 28),
        '-cpu-used', String(options['cpu-used'] || options.preset || 4),
        '-pix_fmt', options.pixelFormat || 'yuv420p10le'
      );
    }

    // Audio codec
    args.push('-c:a', 'aac', '-b:a', '128k');

    // HLS options
    if (options.hls_time) {
      args.push(
        '-f', 'hls',
        '-hls_time', String(options.hls_time),
        '-hls_playlist_type', options.hls_playlist_type || 'vod',
        '-hls_segment_type', options.hlsSegmentType || 'mpegts',
        '-hls_segment_filename', options.hlsSegmentFilename,
        '-hls_flags', options.hls_flags || ''
      );
    }

    // Output path
    args.push('-y', outputPath);

    return args;
  }

  /**
   * Extract single frame as thumbnail
   * @param {string} inputPath - Input video path
   * @param {string} outputPath - Output image path
   * @param {Object} options - Thumbnail options
   */
  async extractFrame(inputPath, outputPath, options = {}) {
    const args = [
      '-i', inputPath,
      '-ss', options.time || '00:00:01', // Seek time
      '-vframes', '1', // Extract one frame
      '-q:v', String(100 - (options.quality || 90)), // JPEG quality (inverse scale)
    ];

    if (options.width) {
      args.push('-vf', `scale=${options.width}:-1`);
    }

    args.push('-y', outputPath);

    const process = execa(this.ffmpegPath, args);
    const processInfo = {
      process,
      pid: process.pid,
      command: 'extractFrame',
      startTime: Date.now()
    };
    this.activeProcesses.set(process.pid, processInfo);
    console.log(`[FFmpeg] Started frame extraction PID: ${process.pid}`);
    
    // Register with global manager if we have a jobId
    if (this.jobId) {
      globalProcessManager.registerProcess(this.jobId, process.pid, {
        command: 'extractFrame',
        path: outputPath
      });
    }

    try {
      await process;
    } finally {
      this.activeProcesses.delete(process.pid);
    }
  }

  /**
   * Track child processes spawned by a parent process
   * @private
   */
  async _trackChildProcesses(parentPid) {
    if (process.platform === 'win32') return; // Not supported on Windows yet
    
    try {
      // Use pgrep to find child processes
      const { stdout } = await execAsync(`pgrep -P ${parentPid} || true`);
      const childPids = stdout.trim().split('\n').filter(pid => pid).map(pid => parseInt(pid));
      
      const parentInfo = this.activeProcesses.get(parentPid);
      if (parentInfo && childPids.length > 0) {
        childPids.forEach(pid => {
          parentInfo.childPids.add(pid);
          
          // Also register child processes with global manager
          if (this.jobId) {
            globalProcessManager.registerProcess(this.jobId, pid, {
              command: 'encode-child',
              parentPid: parentPid
            });
          }
        });
        console.log(`[FFmpeg] Found ${childPids.length} child processes for PID ${parentPid}: ${childPids.join(', ')}`);
      }
    } catch (e) {
      // Ignore errors in child tracking
    }
  }

  /**
   * Get all FFmpeg processes including children
   * @private
   */
  async _getAllFfmpegPids() {
    const allPids = new Set();
    
    // Add main processes
    for (const [pid, info] of this.activeProcesses) {
      allPids.add(pid);
      // Add tracked children
      if (info.childPids) {
        info.childPids.forEach(childPid => allPids.add(childPid));
      }
    }
    
    // Only look for ffmpeg processes that match our output paths
    if (process.platform !== 'win32' && this.activeProcesses.size > 0) {
      try {
        // Get unique output directories
        const outputDirs = new Set();
        for (const [pid, info] of this.activeProcesses) {
          if (info.outputPath) {
            const dir = info.outputPath.split('/').slice(0, -1).join('/');
            outputDirs.add(dir);
          }
        }
        
        // Find ffmpeg processes working on our specific directories
        for (const dir of outputDirs) {
          try {
            // Look for ffmpeg processes that have our output directory in their command line
            const { stdout } = await execAsync(`ps aux | grep -v grep | grep ffmpeg | grep "${dir}" | awk '{print $2}' || true`);
            const pids = stdout.trim().split('\n').filter(pid => pid).map(pid => parseInt(pid));
            pids.forEach(pid => allPids.add(pid));
          } catch (e) {
            // Ignore
          }
        }
      } catch (e) {
        // Ignore
      }
    }
    
    return Array.from(allPids);
  }

  /**
   * Kill all active FFmpeg processes
   */
  async killAll() {
    console.log(`[FFmpeg] Starting comprehensive kill of ${this.activeProcesses.size} active processes`);
    
    try {
      // Get all PIDs including children
      const allPids = await this._getAllFfmpegPids();
      console.log(`[FFmpeg] Total PIDs to kill (including children): ${allPids.length}`);
      
      // First, try to kill processes gracefully via execa
      for (const [pid, info] of this.activeProcesses) {
        try {
          if (info.process && info.process.kill) {
            info.process.kill('SIGTERM');
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // Give processes 100ms to terminate gracefully
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now force kill everything
      if (process.platform === 'darwin' || process.platform === 'linux') {
        // Kill all our tracked PIDs
        for (const pid of allPids) {
          try {
            process.kill(pid, 'SIGKILL');
          } catch (e) {
            // Process might already be dead
          }
        }
        
        // Only kill processes that we know we started
        console.log('[FFmpeg] Killing only our tracked processes and their children...');
        
        // Kill each tracked PID and its children specifically
        for (const pid of allPids) {
          try {
            // Kill the process
            execSync(`kill -9 ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
            // Kill all children of this specific PID
            execSync(`pkill -9 -P ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
          } catch (e) {
            // Process might already be dead
          }
        }
        
        // Only kill processes accessing our specific output directories
        const processedDirs = new Set();
        for (const [pid, info] of this.activeProcesses) {
          if (info.outputPath) {
            const outputDir = info.outputPath.split('/').slice(0, -1).join('/');
            if (!processedDirs.has(outputDir)) {
              processedDirs.add(outputDir);
              // Only kill processes that are accessing our specific output directory
              try {
                const { stdout } = await execAsync(`lsof +D "${outputDir}" 2>/dev/null | awk 'NR>1 {print $2}' | sort -u || true`);
                const dirPids = stdout.trim().split('\n').filter(p => p);
                for (const dirPid of dirPids) {
                  // Only kill if it's in our tracked PIDs or their children
                  if (allPids.includes(parseInt(dirPid))) {
                    execSync(`kill -9 ${dirPid} 2>/dev/null || true`, { stdio: 'ignore' });
                  }
                }
              } catch (e) {
                // Ignore
              }
            }
          }
        }
      } else if (process.platform === 'win32') {
        try {
          // Windows: kill all ffmpeg.exe processes
          execSync('taskkill /F /IM ffmpeg.exe /T 2>nul || exit 0', { stdio: 'ignore', shell: true });
          
          // Kill specific PIDs
          for (const pid of allPids) {
            try {
              execSync(`taskkill /F /PID ${pid} /T 2>nul || exit 0`, { stdio: 'ignore', shell: true });
            } catch (e) {
              // Ignore
            }
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // Cancel via execa
      for (const [pid, info] of this.activeProcesses) {
        try {
          if (info.process && info.process.cancel) {
            info.process.cancel();
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // Clear the map
      const processCount = this.activeProcesses.size;
      this.activeProcesses.clear();
      
      console.log(`[FFmpeg] Kill operation completed. Cleared ${processCount} processes from tracking`);
      
      // Final verification
      if (process.platform !== 'win32') {
        try {
          const { stdout } = await execAsync('pgrep -f ffmpeg || true');
          const remainingPids = stdout.trim().split('\n').filter(pid => pid);
          if (remainingPids.length > 0) {
            console.warn(`[FFmpeg] Warning: ${remainingPids.length} ffmpeg processes still running after standard kill`);
            
            // Check if any of the remaining processes are actually ours
            const ourPaths = [];
            for (const [pid, info] of this.activeProcesses) {
              if (info.outputPath) {
                const outputDir = info.outputPath.split('/').slice(0, -1).join('/');
                ourPaths.push(outputDir);
              }
            }
            
            if (ourPaths.length > 0) {
              // Use ProcessKiller with targeted approach
              console.log('[FFmpeg] Using ProcessKiller to target our specific processes...');
              ProcessKiller.killFFmpegByPaths(ourPaths);
              
              // Also kill processes accessing our output directories
              for (const path of ourPaths) {
                ProcessKiller.killProcessesAccessingDirectory(path);
              }
            }
          } else {
            console.log('[FFmpeg] Verified: No ffmpeg processes remaining');
          }
        } catch (e) {
          // Ignore
        }
      }
    } catch (error) {
      console.error('[FFmpeg] Critical error in killAll:', error);
    }
  }
}