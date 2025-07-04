import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

/**
 * More reliable process finder using lsof
 */
export class ProcessFinder {
  static getAppDirectory() {
    return path.join(os.homedir(), 'Library', 'Application Support', 'framesend-app');
  }

  /**
   * Find all processes accessing a specific directory
   */
  static async findProcessesByDirectory(directory) {
    const processes = [];
    
    try {
      // Use lsof to find processes accessing the directory
      // +D for recursive directory search
      const lsofOutput = execSync(`lsof +D "${directory}" 2>/dev/null || true`, { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      const lines = lsofOutput.trim().split('\n').filter(line => line);
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.trim().split(/\s+/);
        
        if (parts.length > 1) {
          const command = parts[0];
          const pid = parseInt(parts[1]);
          
          if (command.toLowerCase().includes('ffmpeg') && pid) {
            processes.push({
              pid,
              command,
              line: line.substring(0, 200)
            });
          }
        }
      }
    } catch (e) {
      console.log(`[ProcessFinder] lsof failed, trying alternative method...`);
      
      // Fallback: use ps and grep
      try {
        const psOutput = execSync(`ps aux | grep ffmpeg | grep "${directory}" | grep -v grep`, { 
          encoding: 'utf8' 
        });
        
        const lines = psOutput.trim().split('\n').filter(line => line);
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[1]);
          
          if (pid) {
            processes.push({
              pid,
              command: 'ffmpeg',
              line: line.substring(0, 200)
            });
          }
        }
      } catch (e2) {
        // No processes found
      }
    }
    
    return processes;
  }

  /**
   * Kill all FFmpeg processes for a specific job
   */
  static async killJobProcesses(jobId) {
    console.log(`[ProcessFinder] Killing processes for job ${jobId}`);
    
    const jobDir = path.join(this.getAppDirectory(), 'encoded-videos', jobId);
    console.log(`[ProcessFinder] Looking for processes accessing: ${jobDir}`);
    
    const processes = await this.findProcessesByDirectory(jobDir);
    console.log(`[ProcessFinder] Found ${processes.length} processes`);
    
    let killedCount = 0;
    for (const proc of processes) {
      console.log(`[ProcessFinder] Killing PID ${proc.pid}: ${proc.command}`);
      try {
        process.kill(proc.pid, 'SIGKILL');
        killedCount++;
      } catch (e) {
        try {
          // Fallback to system kill
          execSync(`kill -9 ${proc.pid} 2>/dev/null`, { stdio: 'ignore' });
          killedCount++;
        } catch (e2) {
          console.log(`[ProcessFinder] Failed to kill PID ${proc.pid}`);
        }
      }
    }
    
    return killedCount;
  }
}

export default ProcessFinder;