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
      
      // Apply audio enhancement if enabled
      if (options.encodingSettings?.audioEnhancement?.enabled) {
        const level = options.encodingSettings.audioEnhancement.level || 3;
        
        // Audio filters based on enhancement level
        const audioFilters = [];
        
        // Level 1-2: Basic normalization
        if (level >= 1) {
          audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
        }
        
        // Level 3-4: Add compression
        if (level >= 3) {
          audioFilters.push('acompressor=threshold=-20dB:ratio=4:attack=5:release=50');
        }
        
        // Level 5: Add equalizer for clarity
        if (level >= 5) {
          audioFilters.push('equalizer=f=3000:t=h:width=200:g=3');
        }
        
        if (audioFilters.length > 0) {
          command.audioFilters(audioFilters.join(','));
        }
      }
      
      // Add metadata to identify our processes
      command.outputOptions('-metadata', `comment=framesend-job-${this.jobId}`);
      
      // Register command immediately
      this.activeCommands.set(commandId, command);
      
      command
        .on('start', (cmd) => {
          // Store the process immediately and keep checking
          const storeProcess = () => {
            if (command.ffmpegProc) {
              this.activeProcesses.set(commandId, command.ffmpegProc);
            } else {
              setTimeout(storeProcess, 50);
            }
          };
          storeProcess();
        })
        .on('end', () => {
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`[FFmpeg] Error encoding ${options.width}x${options.height}:`);
          console.error(`[FFmpeg] Error: ${err.message}`);
          if (stderr) {
            console.error(`[FFmpeg] Stderr: ${stderr}`);
          }
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
      
      // Set video codec
      if (options.codec === 'libx264' || options.codec === 'h264' || !options.codec) {
        // Always use libx264 for now - hardware acceleration can be added later with proper detection
        command.videoCodec('libx264');
      } else {
        command.videoCodec(options.codec);
      }
      
      // Video filters
      if (options.videoFilters) {
        command.videoFilters(options.videoFilters);
      }
      
      // H.264 options
      if (options.codec === 'libx264' || options.codec === 'h264' || !options.codec) {
        command
          .outputOptions('-preset', options.preset || 'medium')
          .outputOptions('-crf', String(options.crf || 23))
          .outputOptions('-pix_fmt', options.pixelFormat || 'yuv420p')
          .outputOptions('-profile:v', options.profile || 'main')
          .outputOptions('-level', options.level || '4.0');
        
        // Apply streaming optimization preset
        const streamingPreset = options.encodingSettings?.streamingPreset || 'balanced';
        if (streamingPreset === 'fast-start') {
          // Optimize for quick start and low latency
          command.outputOptions('-movflags', '+faststart');
          command.outputOptions('-preset', 'faster');
          if (!options.encodingSettings?.hardwareAcceleration?.enabled) {
            command.outputOptions('-tune', 'zerolatency');
          }
        } else if (streamingPreset === 'bandwidth-optimized') {
          // Optimize for lower bandwidth
          command.outputOptions('-movflags', '+faststart');
          if (!options.encodingSettings?.hardwareAcceleration?.enabled) {
            command.outputOptions('-tune', 'film');
            command.outputOptions('-x264-params', 'aq-mode=3:aq-strength=1.0');
          }
        }
        // 'balanced' uses default settings
        
        if (options.videoBitrate) {
          command.videoBitrate(options.videoBitrate);
        }
        if (options.maxrate) {
          command.outputOptions('-maxrate', options.maxrate);
        }
        if (options.bufsize) {
          command.outputOptions('-bufsize', options.bufsize);
        }
        // Temporarily disable x264-params to debug encoding issues
        // if (options['x264-params'] && !options.encodingSettings?.hardwareAcceleration?.enabled) {
        //   command.outputOptions('-x264-params', options['x264-params']);
        // }
      }
      
      // AV1 options
      if (options.codec === 'libsvtav1') {
        command
          .videoCodec('libsvtav1')
          .outputOptions('-crf', String(options.crf || 35))
          .outputOptions('-preset', String(options.preset || 8))
          .outputOptions('-pix_fmt', options.pixelFormat || 'yuv420p10le')
          // GOP settings for AV1 - 2 second GOP at source framerate
          // This will be overridden by force_key_frames for HLS
          .outputOptions('-g', '120')  // 2 seconds at 60fps (conservative)
          .outputOptions('-keyint_min', '120')
          .outputOptions('-sc_threshold', '0');  // Disable scene detection for consistent segments
        
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
      
      // Apply audio enhancement if enabled
      if (options.encodingSettings?.audioEnhancement?.enabled) {
        const level = options.encodingSettings.audioEnhancement.level || 3;
        
        // Audio filters based on enhancement level
        const audioFilters = [];
        
        // Level 1-2: Basic normalization
        if (level >= 1) {
          audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
        }
        
        // Level 3-4: Add compression
        if (level >= 3) {
          audioFilters.push('acompressor=threshold=-20dB:ratio=4:attack=5:release=50');
        }
        
        // Level 5: Add equalizer for clarity
        if (level >= 5) {
          audioFilters.push('equalizer=f=3000:t=h:width=200:g=3');
        }
        
        if (audioFilters.length > 0) {
          command.audioFilters(audioFilters.join(','));
        }
        
        // Increase bitrate for higher quality levels
        if (level >= 4) {
          command.audioBitrate('192k');
        }
      }
      
      // HLS options with forced keyframes for consistent segmentation
      if (options.hls_time) {
        // Set up HLS output
        command
          .outputOptions('-f', 'hls')
          .outputOptions('-hls_time', String(options.hls_time))
          .outputOptions('-hls_playlist_type', options.hls_playlist_type || 'vod')
          .outputOptions('-hls_segment_type', options.hls_segment_type || 'mpegts')
          .outputOptions('-hls_segment_filename', options.hlsSegmentFilename || options.hls_segment_filename)
          .outputOptions('-hls_flags', options.hls_flags || '');
      }
      
      // Add metadata to identify our processes
      command.outputOptions('-metadata', `comment=framesend-job-${this.jobId}`);
      
      // Register command immediately before starting
      this.activeCommands.set(commandId, command);
      
      // Set up event handlers
      command
        .on('start', (cmd) => {
          console.log(`[FFmpeg] Starting encoding for ${options.width}x${options.height}:`);
          console.log(`[FFmpeg] Command: ${cmd}`);
          // Store the process immediately and keep checking
          const storeProcess = () => {
            if (command.ffmpegProc) {
              this.activeProcesses.set(commandId, command.ffmpegProc);
            } else {
              setTimeout(storeProcess, 50);
            }
          };
          storeProcess();
        })
        .on('stderr', (stderrLine) => {
          // Log errors from FFmpeg
          if (stderrLine.includes('Error') || stderrLine.includes('Invalid')) {
            console.error(`[FFmpeg stderr] ${stderrLine}`);
          }
          // Parse stderr for HLS segment completion
          // FFmpeg outputs lines like: "[hls @ 0x...] Opening 'segment_0001.m4s' for writing"
          const segmentMatch = stderrLine.match(/Opening '(.*(segment_\d+\.m4s))' for writing/);
          if (segmentMatch) {
            const segmentPath = segmentMatch[1];
            const segmentFile = segmentMatch[2];
            const segmentNumber = parseInt(segmentFile.match(/segment_(\d+)/)[1]);
            
            // Emit segment ready event
            if (options.onSegmentReady) {
              // Wait a bit to ensure file is fully written
              setTimeout(() => {
                options.onSegmentReady({
                  segmentPath,
                  segmentFile,
                  segmentNumber,
                  rendition: options.renditionName || 'unknown'
                });
              }, 100);
            }
          }
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            onProgress(progress.percent / 100);
          }
        })
        .on('end', () => {
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          onProgress(1);
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          
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
      this.activeCommands.set(commandId, command);
      
      command
        .on('start', (cmd) => {
          // Store the process immediately
          const storeProcess = () => {
            if (command.ffmpegProc) {
              this.activeProcesses.set(commandId, command.ffmpegProc);
            } else {
              setTimeout(storeProcess, 50);
            }
          };
          storeProcess();
        })
        .on('end', () => {
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          resolve();
        })
        .on('error', (err, stdout, stderr) => {
          console.error(`[FFmpeg] Error encoding ${options.width}x${options.height}:`);
          console.error(`[FFmpeg] Error: ${err.message}`);
          if (stderr) {
            console.error(`[FFmpeg] Stderr: ${stderr}`);
          }
          this.activeCommands.delete(commandId);
          this.activeProcesses.delete(commandId);
          reject(err);
        });
      
      // Video size - use scale filter for better compatibility
      if (options.width && options.height) {
        // Use simple scaling that maintains aspect ratio
        command.videoFilters(`scale=${options.width}:${options.height}`);
      } else if (options.width) {
        command.videoFilters(`scale=${options.width}:-2`);
      } else if (options.height) {
        command.videoFilters(`scale=-2:${options.height}`);
      }
      
      command.save(outputPath);
    });
  }

  /**
   * Kill all active commands
   */
  async killAll() {
    if (this.activeCommands.size === 0 && this.activeProcesses.size === 0) {
      return;
    }
    
    // First try to kill via stored processes
    for (const [commandId, proc] of this.activeProcesses) {
      try {
        if (proc && proc.pid) {
          proc.kill('SIGKILL');
        }
      } catch (err) {
        // Ignore errors
      }
    }
    
    // Then try to kill via commands
    for (const [commandId, command] of this.activeCommands) {
      try {
        // Try command.kill first (this is the proper fluent-ffmpeg way)
        if (typeof command.kill === 'function') {
          command.kill('SIGKILL');
        }
      } catch (err) {
        // Ignore errors
      }
    }
    
    // Clear both maps
    this.activeCommands.clear();
    this.activeProcesses.clear();
  }
}