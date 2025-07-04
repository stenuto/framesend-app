import { execSync } from 'child_process';
import process from 'process';

/**
 * System-level process killer utility
 * Provides aggressive process termination methods as a last resort
 */
export class ProcessKiller {
  /**
   * Kill FFmpeg processes that match specific criteria
   * Only kills processes that appear to be from our app based on output paths
   * @param {string[]} outputPaths - Array of output paths to match against
   */
  static killFFmpegByPaths(outputPaths = []) {
    console.log('[ProcessKiller] Killing FFmpeg processes matching our output paths');
    
    if (!outputPaths || outputPaths.length === 0) {
      console.log('[ProcessKiller] No output paths provided, skipping');
      return;
    }
    
    if (process.platform === 'darwin' || process.platform === 'linux') {
      // Kill only ffmpeg processes that match our output paths
      for (const path of outputPaths) {
        try {
          // Find PIDs of ffmpeg processes working on our specific paths
          const pids = execSync(
            `ps aux | grep -v grep | grep ffmpeg | grep "${path}" | awk '{print $2}' || true`,
            { encoding: 'utf8' }
          ).trim().split('\n').filter(pid => pid);
          
          for (const pid of pids) {
            try {
              execSync(`kill -9 ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
              console.log(`[ProcessKiller] Killed PID ${pid} (matched path: ${path})`);
            } catch (e) {
              // Ignore
            }
          }
        } catch (e) {
          // Ignore
        }
      }
      
    } else if (process.platform === 'win32') {
      // On Windows, we need to be more careful
      // We can't easily filter by command line, so we'll only kill if we have specific PIDs
      console.log('[ProcessKiller] Windows path-based killing not implemented');
    }
  }
  
  /**
   * Kill specific process by PID with extreme prejudice
   */
  static killPid(pid) {
    if (!pid) return;
    
    console.log(`[ProcessKiller] Terminating PID ${pid}`);
    
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const commands = [
        `kill -9 ${pid} 2>/dev/null || true`,
        `pkill -9 -P ${pid} 2>/dev/null || true`, // Kill children
        `kill -KILL ${pid} 2>/dev/null || true`
      ];
      
      for (const cmd of commands) {
        try {
          execSync(cmd, { stdio: 'ignore', shell: true });
        } catch (e) {
          // Ignore
        }
      }
    } else if (process.platform === 'win32') {
      try {
        execSync(`taskkill /F /PID ${pid} /T 2>nul || exit 0`, { stdio: 'ignore', shell: true });
      } catch (e) {
        // Ignore
      }
    }
  }
  
  /**
   * Kill all processes accessing a specific directory
   */
  static killProcessesAccessingDirectory(directory) {
    if (!directory) return;
    
    console.log(`[ProcessKiller] Killing processes accessing directory: ${directory}`);
    
    if (process.platform === 'darwin' || process.platform === 'linux') {
      try {
        // Use lsof to find processes accessing the directory
        const cmd = `lsof +D "${directory}" 2>/dev/null | awk 'NR>1 {print $2}' | sort -u | xargs -r kill -9 2>/dev/null || true`;
        execSync(cmd, { stdio: 'ignore', shell: true });
      } catch (e) {
        // Ignore
      }
    }
  }
}