import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Robust process killer that finds and kills FFmpeg processes by job ID
 */
export class RobustKiller {
  /**
   * Kill all FFmpeg processes for a specific job
   */
  static async killJobProcesses(jobId) {
    console.log(`[RobustKiller] Killing processes for job ${jobId}`);
    
    try {
      // On macOS/Linux, use ps and grep to find processes
      if (process.platform !== 'win32') {
        // Find all ffmpeg processes with our job ID in the metadata
        const findCmd = `ps aux | grep -E "ffmpeg.*framesend-job-${jobId}" | grep -v grep | awk '{print $2}'`;
        
        const { stdout: pids } = await execAsync(findCmd);
        const pidList = pids.trim().split('\n').filter(pid => pid);
        
        console.log(`[RobustKiller] Found ${pidList.length} processes for job ${jobId}`);
        
        if (pidList.length > 0) {
          // Kill each process
          for (const pid of pidList) {
            try {
              console.log(`[RobustKiller] Killing PID ${pid}`);
              await execAsync(`kill -9 ${pid}`);
            } catch (err) {
              console.error(`[RobustKiller] Failed to kill PID ${pid}:`, err.message);
            }
          }
          
          return pidList.length;
        }
      } else {
        // Windows implementation
        const findCmd = `wmic process where "name='ffmpeg.exe' and commandline like '%framesend-job-${jobId}%'" get processid`;
        
        const { stdout } = await execAsync(findCmd);
        const lines = stdout.trim().split('\n');
        const pids = lines.slice(1).map(line => line.trim()).filter(pid => pid && pid !== 'ProcessId');
        
        console.log(`[RobustKiller] Found ${pids.length} processes for job ${jobId}`);
        
        for (const pid of pids) {
          try {
            console.log(`[RobustKiller] Killing PID ${pid}`);
            await execAsync(`taskkill /F /PID ${pid}`);
          } catch (err) {
            console.error(`[RobustKiller] Failed to kill PID ${pid}:`, err.message);
          }
        }
        
        return pids.length;
      }
    } catch (error) {
      console.error('[RobustKiller] Error finding/killing processes:', error);
      return 0;
    }
    
    return 0;
  }
  
  /**
   * Kill all FFmpeg processes started by our app
   */
  static async killAllAppFFmpeg() {
    console.log('[RobustKiller] Killing all app FFmpeg processes');
    
    try {
      if (process.platform !== 'win32') {
        // Find all ffmpeg processes with our metadata
        const findCmd = `ps aux | grep -E "ffmpeg.*framesend-job-" | grep -v grep | awk '{print $2}'`;
        
        const { stdout: pids } = await execAsync(findCmd);
        const pidList = pids.trim().split('\n').filter(pid => pid);
        
        console.log(`[RobustKiller] Found ${pidList.length} app FFmpeg processes`);
        
        if (pidList.length > 0) {
          // Kill all at once
          const killCmd = `kill -9 ${pidList.join(' ')}`;
          await execAsync(killCmd);
          console.log(`[RobustKiller] Killed ${pidList.length} processes`);
          return pidList.length;
        }
      } else {
        // Windows implementation
        const findCmd = `wmic process where "name='ffmpeg.exe' and commandline like '%framesend-job-%'" get processid`;
        
        const { stdout } = await execAsync(findCmd);
        const lines = stdout.trim().split('\n');
        const pids = lines.slice(1).map(line => line.trim()).filter(pid => pid && pid !== 'ProcessId');
        
        console.log(`[RobustKiller] Found ${pids.length} app FFmpeg processes`);
        
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /F /PID ${pid}`);
          } catch (err) {
            console.error(`[RobustKiller] Failed to kill PID ${pid}:`, err.message);
          }
        }
        
        return pids.length;
      }
    } catch (error) {
      console.error('[RobustKiller] Error:', error);
    }
    
    return 0;
  }
  
  /**
   * Get info about running FFmpeg processes
   */
  static async getRunningFFmpegInfo() {
    try {
      if (process.platform !== 'win32') {
        const { stdout } = await execAsync('ps aux | grep -E "ffmpeg" | grep -v grep');
        const lines = stdout.trim().split('\n').filter(line => line);
        
        return lines.map(line => {
          const parts = line.split(/\s+/);
          const pid = parts[1];
          const command = parts.slice(10).join(' ');
          const isOurs = command.includes('framesend-job-');
          
          return {
            pid,
            command,
            isOurs,
            jobId: isOurs ? command.match(/framesend-job-([a-zA-Z0-9_-]+)/)?.[1] : null
          };
        });
      } else {
        const { stdout } = await execAsync('wmic process where "name=\'ffmpeg.exe\'" get processid,commandline /format:csv');
        const lines = stdout.trim().split('\n').slice(2); // Skip header lines
        
        return lines.map(line => {
          const [, command, pid] = line.split(',');
          const isOurs = command && command.includes('framesend-job-');
          
          return {
            pid,
            command: command || '',
            isOurs,
            jobId: isOurs ? command.match(/framesend-job-([a-zA-Z0-9_-]+)/)?.[1] : null
          };
        }).filter(p => p.pid);
      }
    } catch (error) {
      console.error('[RobustKiller] Error getting process info:', error);
      return [];
    }
  }
}

export default RobustKiller;