import { execSync } from 'child_process';

/**
 * Simple, direct FFmpeg killer that just works
 */
export function killAllAppFFmpeg() {
  console.log('[SimpleKiller] Killing ALL FFmpeg processes for this app');
  
  let killed = 0;
  
  try {
    // Get all FFmpeg PIDs
    const pids = execSync("ps aux | grep -i ffmpeg | grep -v grep | awk '{print $2}'", { 
      encoding: 'utf8' 
    }).trim().split('\n').filter(pid => pid);
    
    console.log(`[SimpleKiller] Found ${pids.length} FFmpeg processes`);
    
    // Kill each one
    pids.forEach(pid => {
      try {
        console.log(`[SimpleKiller] Killing PID ${pid}`);
        execSync(`kill -9 ${pid}`);
        killed++;
      } catch (e) {
        // Already dead
      }
    });
    
  } catch (e) {
    console.log('[SimpleKiller] No FFmpeg processes found');
  }
  
  console.log(`[SimpleKiller] Killed ${killed} processes`);
  return killed;
}

export function killFFmpegForJob(jobId) {
  console.log(`[SimpleKiller] Killing FFmpeg processes for job ${jobId}`);
  
  // For now, since we can't reliably find by job ID,
  // we'll kill all FFmpeg processes when any cancel is clicked
  // This is the same as what the "Stop All" button did
  return killAllAppFFmpeg();
}

export default {
  killAllAppFFmpeg,
  killFFmpegForJob
};