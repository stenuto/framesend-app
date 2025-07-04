import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

/**
 * Direct FFmpeg process killer that doesn't rely on complex tracking
 * Just finds and kills FFmpeg processes based on the app's directories
 */
export class FFmpegKiller {
  static getAppDirectory() {
    return path.join(os.homedir(), 'Library', 'Application Support', 'framesend-app');
  }

  static async killAllAppFFmpeg() {
    console.log('[FFmpegKiller] Killing all Framesend FFmpeg processes...');
    
    const appDir = this.getAppDirectory();
    let killedCount = 0;
    
    try {
      // Get all FFmpeg processes
      const psOutput = execSync('ps aux | grep ffmpeg | grep -v grep', { encoding: 'utf8' });
      const lines = psOutput.trim().split('\n').filter(line => line);
      
      for (const line of lines) {
        // Check if this process is working on our app's files
        if (line.includes(appDir) || line.includes('framesend')) {
          // Extract PID (second column)
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[1]);
          
          if (pid) {
            console.log(`[FFmpegKiller] Killing PID ${pid}: ${line.substring(0, 100)}...`);
            try {
              // Force kill
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              killedCount++;
            } catch (e) {
              // Process might already be dead
            }
          }
        }
      }
    } catch (e) {
      // No FFmpeg processes found
    }
    
    console.log(`[FFmpegKiller] Killed ${killedCount} processes`);
    return killedCount;
  }

  static async killByJobId(jobId) {
    console.log(`[FFmpegKiller] Killing processes for job ${jobId}...`);
    
    if (!jobId) {
      console.error('[FFmpegKiller] No job ID provided');
      return 0;
    }
    
    let killedCount = 0;
    const appDir = this.getAppDirectory();
    
    try {
      // Get all FFmpeg processes
      const psOutput = execSync('ps aux | grep ffmpeg | grep -v grep', { encoding: 'utf8' });
      const lines = psOutput.trim().split('\n').filter(line => line);
      
      console.log(`[FFmpegKiller] Found ${lines.length} FFmpeg processes, checking for job ${jobId}`);
      
      // Debug: log all FFmpeg processes
      lines.forEach((line, index) => {
        console.log(`[FFmpegKiller] Process ${index + 1}: ${line.substring(0, 300)}`);
      });
      
      for (const line of lines) {
        // Check multiple conditions:
        // 1. Job ID in the command line
        // 2. Output path contains the job ID (encoded-videos/jobId/)
        // 3. Process is working on our app's files
        const containsJobId = line.includes(jobId);
        const isOurApp = line.includes(appDir) || line.includes('framesend-app');
        const outputPathMatch = line.includes(`encoded-videos/${jobId}`) || line.includes(`/${jobId}/`);
        
        console.log(`[FFmpegKiller] Checking process: jobId=${containsJobId}, ourApp=${isOurApp}, outputPath=${outputPathMatch}`);
        
        if ((containsJobId || outputPathMatch) && isOurApp) {
          // Extract PID (second column)
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[1]);
          
          if (pid) {
            console.log(`[FFmpegKiller] Found match! Killing PID ${pid} for job ${jobId}`);
            console.log(`[FFmpegKiller] Command: ${line.substring(0, 200)}...`);
            try {
              // Force kill
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
              killedCount++;
            } catch (e) {
              // Process might already be dead
            }
          }
        }
      }
      
      // If we didn't find any with the job ID, try a more aggressive approach
      // Kill any FFmpeg process working on our app's encoded-videos directory
      if (killedCount === 0) {
        console.log(`[FFmpegKiller] No processes found with job ID, trying broader search...`);
        
        for (const line of lines) {
          if (line.includes(`${appDir}/encoded-videos/`)) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[1]);
            
            if (pid) {
              console.log(`[FFmpegKiller] Killing possibly related PID ${pid}`);
              try {
                execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
                killedCount++;
              } catch (e) {
                // Process might already be dead
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`[FFmpegKiller] Error getting process list:`, e.message);
    }
    
    console.log(`[FFmpegKiller] Killed ${killedCount} processes for job ${jobId}`);
    return killedCount;
  }

  static getRunningFFmpegInfo() {
    const processes = [];
    
    try {
      const psOutput = execSync('ps aux | grep ffmpeg | grep -v grep', { encoding: 'utf8' });
      const lines = psOutput.trim().split('\n').filter(line => line);
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[1]);
        const cpu = parts[2];
        const mem = parts[3];
        const command = parts.slice(10).join(' ');
        
        processes.push({
          pid,
          cpu,
          mem,
          command,
          isOurs: line.includes(this.getAppDirectory()) || line.includes('framesend')
        });
      }
    } catch (e) {
      // No processes found
    }
    
    return processes;
  }
}

// Export for use in main process
export default FFmpegKiller;