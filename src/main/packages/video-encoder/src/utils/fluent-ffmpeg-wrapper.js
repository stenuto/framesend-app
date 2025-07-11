import ffmpeg from 'fluent-ffmpeg';
import { EventEmitter } from 'events';
import path from 'path';

/**
 * FFmpeg wrapper using fluent-ffmpeg for proper process management
 */
export class FluentFFmpegWrapper extends EventEmitter {
  constructor(binaries, jobId = null) {
    super();
    this.ffmpegPath = binaries.ffmpeg || 'ffmpeg';
    this.ffprobePath = binaries.ffprobe || 'ffprobe';
    this.jobId = jobId;
    this.activeCommands = new Map(); // Map of commandId -> ffmpeg command
    this.activeProcesses = new Map(); // Map of commandId -> process
    
    console.log(`[FluentFFmpeg] Constructor called for job ${jobId}`);
    console.log(`[FluentFFmpeg] FFmpeg path: ${this.ffmpegPath}`);
    console.log(`[FluentFFmpeg] FFprobe path: ${this.ffprobePath}`);
    
    // Set binary paths globally
    ffmpeg.setFfmpegPath(this.ffmpegPath);
    ffmpeg.setFfprobePath(this.ffprobePath);
  }

  /**
   * Probe video file for metadata
   */
  async probe(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe failed: ${err.message}`));
        } else {
          resolve(metadata);
        }
      });
    });
  }

  /**
   * Extract audio from video
   */
  async extractAudio(inputPath, outputPath, options) {
    const commandId = `audio-${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .noVideo()
        .audioCodec(options.codec)
        .audioBitrate(options.bitrate)
        .audioChannels(options.channels)
        .audioFrequency(options.sampleRate)
        .output(outputPath);
      
      // Add metadata to identify our processes
      command.outputOptions('-metadata', `comment=framesend-job-${this.jobId}`);
      
      // Register command immediately
      console.log(`[FluentFFmpeg] Pre-registering audio command ${commandId} for job ${this.jobId}`);
      this.activeCommands.set(commandId, command);
      
      command
        .on('start', (cmd) => {
          console.log(`[FluentFFmpeg] Started audio extraction: ${cmd}`);
          console.log(`[FluentFFmpeg] Active commands now: ${this.activeCommands.size}`);
          
          // Store the process immediately and keep checking
          const storeProcess = () => {
            if (command.ffmpegProc) {
              console.log(`[FluentFFmpeg] Storing process PID ${command.ffmpegProc.pid} for command ${commandId}`);
              this.activeProcesses.set(commandId, command.ffmpegProc);
            } else {
              console.log(`[FluentFFmpeg] WARNING: No ffmpegProc available yet for ${commandId}, retrying...`);
              setTimeout(storeProcess, 50);
            }
          };
          storeProcess();
        })
        .on('end', () => {
          console.log(`[FluentFFmpeg] Audio extraction completed`);
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[FluentFFmpeg] Audio extraction failed:`, err);
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          reject(err);
        });
      
      command.run();
    });
  }

  /**
   * Encode video with progress tracking
   */
  async encodeWithProgress(inputPath, outputPath, options, onProgress) {
    const commandId = `encode-${Date.now()}-${path.basename(outputPath)}`;
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);
      
      // Video codec
      command.videoCodec(options.codec || 'libx264');
      
      // Video filters
      if (options.videoFilters) {
        command.videoFilters(options.videoFilters);
      }
      
      // H.264 options
      if (options.codec === 'libx264' || !options.codec) {
        command
          .outputOptions('-preset', options.preset || 'medium')
          .outputOptions('-crf', String(options.crf || 23))
          .outputOptions('-pix_fmt', options.pixelFormat || 'yuv420p')
          .outputOptions('-profile:v', options.profile || 'main')
          .outputOptions('-level', options.level || '4.0');
        
        if (options.videoBitrate) {
          command.videoBitrate(options.videoBitrate);
        }
        if (options.maxrate) {
          command.outputOptions('-maxrate', options.maxrate);
        }
        if (options.bufsize) {
          command.outputOptions('-bufsize', options.bufsize);
        }
        if (options['x264-params']) {
          command.outputOptions('-x264-params', options['x264-params']);
        }
      }
      
      // AV1 options
      if (options.codec === 'libsvtav1') {
        command
          .videoCodec('libsvtav1')
          .outputOptions('-crf', String(options.crf || 35))
          .outputOptions('-preset', String(options.preset || 8))
          .outputOptions('-pix_fmt', options.pixelFormat || 'yuv420p10le')
          // GOP settings for AV1 - 2 second GOP
          .outputOptions('-g', '240')
          .outputOptions('-keyint_min', '240')
          .outputOptions('-sc_threshold', '40');
        
        if (options.maxrate) {
          command.outputOptions('-maxrate', options.maxrate);
        }
        if (options.bufsize) {
          command.outputOptions('-bufsize', options.bufsize);
        }
        if (options['svtav1-params']) {
          command.outputOptions('-svtav1-params', options['svtav1-params']);
        }
        // Add movflags for AV1
        command.outputOptions('-movflags', '+faststart');
      }
      
      // Audio
      command.audioCodec('aac').audioBitrate('128k');
      
      // HLS options
      if (options.hls_time) {
        command
          .outputOptions('-f', 'hls')
          .outputOptions('-hls_time', String(options.hls_time))
          .outputOptions('-hls_playlist_type', options.hls_playlist_type || 'vod')
          .outputOptions('-hls_segment_type', options.hls_segment_type || 'mpegts')
          .outputOptions('-hls_segment_filename', options.hlsSegmentFilename)
          .outputOptions('-hls_flags', options.hls_flags || '');
      }
      
      // Add metadata to identify our processes
      command.outputOptions('-metadata', `comment=framesend-job-${this.jobId}`);
      
      // Register command immediately before starting
      console.log(`[FluentFFmpeg] Pre-registering command ${commandId} for job ${this.jobId}`);
      this.activeCommands.set(commandId, command);
      
      // Set up event handlers
      command
        .on('start', (cmd) => {
          console.log(`[FluentFFmpeg] Started encoding: ${commandId}`);
          console.log(`[FluentFFmpeg] Full command:\n${cmd}`);
          console.log(`[FluentFFmpeg] Active commands now: ${this.activeCommands.size}`);
          
          // Store the process immediately and keep checking
          const storeProcess = () => {
            if (command.ffmpegProc) {
              console.log(`[FluentFFmpeg] Storing process PID ${command.ffmpegProc.pid} for command ${commandId}`);
              this.activeProcesses.set(commandId, command.ffmpegProc);
            } else {
              console.log(`[FluentFFmpeg] WARNING: No ffmpegProc available yet for ${commandId}, retrying...`);
              setTimeout(storeProcess, 50);
            }
          };
          storeProcess();
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            onProgress(progress.percent / 100);
          }
        })
        .on('end', () => {
          console.log(`[FluentFFmpeg] Encoding completed: ${commandId}`);
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          onProgress(1);
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`[FluentFFmpeg] Encoding failed: ${commandId}`, err.message);
          if (stderr) {
            console.error(`[FluentFFmpeg] FFmpeg stderr:\n${stderr}`);
          }
          console.log(`[FluentFFmpeg] Removing command ${commandId} from tracking due to error`);
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          console.log(`[FluentFFmpeg] Active commands after error: ${this.activeCommands.size}`);
          
          if (err.message.includes('SIGKILL') || err.message.includes('SIGTERM') || err.message.includes('Exiting normally, received signal 9')) {
            reject(new Error('Encoding cancelled'));
          } else {
            reject(new Error(`FFmpeg encoding failed: ${err.message}`));
          }
        });
      
      // Save output
      command.save(outputPath);
    });
  }

  /**
   * Extract frame for thumbnail
   */
  async extractFrame(inputPath, outputPath, options = {}) {
    const commandId = `frame-${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .seekInput(options.time || '00:00:01')
        .frames(1);
      
      // Add metadata to identify our processes
      command.outputOptions('-metadata', `comment=framesend-job-${this.jobId}`);
      
      // Register command immediately
      console.log(`[FluentFFmpeg] Pre-registering frame command ${commandId} for job ${this.jobId}`);
      this.activeCommands.set(commandId, command);
      
      command
        .on('start', (cmd) => {
          console.log(`[FluentFFmpeg] Started frame extraction: ${cmd}`);
          
          // Store the process immediately
          const storeProcess = () => {
            if (command.ffmpegProc) {
              console.log(`[FluentFFmpeg] Storing process PID ${command.ffmpegProc.pid} for command ${commandId}`);
              this.activeProcesses.set(commandId, command.ffmpegProc);
            } else {
              console.log(`[FluentFFmpeg] WARNING: No ffmpegProc available yet for ${commandId}, retrying...`);
              setTimeout(storeProcess, 50);
            }
          };
          storeProcess();
        })
        .on('end', () => {
          console.log(`[FluentFFmpeg] Frame extraction completed`);
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[FluentFFmpeg] Frame extraction failed:`, err);
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          reject(err);
        });
      
      if (options.width) {
        command.size(`${options.width}x?`);
      }
      
      command.save(outputPath);
    });
  }

  /**
   * Kill all active commands
   */
  async killAll() {
    console.log(`[FluentFFmpeg] killAll() called for job ${this.jobId}`);
    console.log(`[FluentFFmpeg] Active commands: ${this.activeCommands.size}`);
    console.log(`[FluentFFmpeg] Active processes: ${this.activeProcesses.size}`);
    
    if (this.activeCommands.size === 0 && this.activeProcesses.size === 0) {
      console.log(`[FluentFFmpeg] WARNING: No active commands or processes to kill!`);
      return;
    }
    
    // First try to kill via stored processes
    console.log(`[FluentFFmpeg] Killing ${this.activeProcesses.size} stored processes...`);
    for (const [commandId, proc] of this.activeProcesses) {
      try {
        if (proc && proc.pid) {
          console.log(`[FluentFFmpeg] Killing process PID ${proc.pid} for command ${commandId}`);
          proc.kill('SIGKILL');
          console.log(`[FluentFFmpeg] Kill signal sent to PID ${proc.pid}`);
        }
      } catch (err) {
        console.error(`[FluentFFmpeg] Error killing process for ${commandId}:`, err);
      }
    }
    
    // Then try to kill via commands
    console.log(`[FluentFFmpeg] Active command IDs:`, Array.from(this.activeCommands.keys()));
    
    for (const [commandId, command] of this.activeCommands) {
      try {
        console.log(`[FluentFFmpeg] Attempting to kill command: ${commandId}`);
        
        // Try command.kill first (this is the proper fluent-ffmpeg way)
        if (typeof command.kill === 'function') {
          console.log(`[FluentFFmpeg] Using command.kill('SIGKILL')`);
          command.kill('SIGKILL');
          console.log(`[FluentFFmpeg] Kill signal sent successfully`);
        } else {
          console.log(`[FluentFFmpeg] ERROR: No kill method available for command ${commandId}`);
        }
      } catch (err) {
        console.error(`[FluentFFmpeg] Error killing command ${commandId}:`, err);
      }
    }
    
    // Clear both maps
    const clearedCommands = this.activeCommands.size;
    const clearedProcesses = this.activeProcesses.size;
    this.activeCommands.clear();
    this.activeProcesses.clear();
    
    console.log(`[FluentFFmpeg] Cleared ${clearedCommands} commands and ${clearedProcesses} processes from tracking`);
  }
}