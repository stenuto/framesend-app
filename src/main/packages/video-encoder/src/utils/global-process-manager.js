import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import process from 'process';

/**
 * Global process manager that tracks ALL FFmpeg processes across all jobs
 * This ensures we can kill processes even if the job tracking fails
 */
class GlobalProcessManager extends EventEmitter {
  constructor() {
    super();
    // Map of jobId -> Set of PIDs
    this.jobProcesses = new Map();
    // Map of PID -> process info
    this.allProcesses = new Map();
    // Track all FFmpeg processes globally
    this.globalProcesses = new Set();
  }

  /**
   * Register a process with a job
   */
  registerProcess(jobId, pid, processInfo) {
    console.log(`[GlobalProcessManager] Registering PID ${pid} for job ${jobId}`);
    
    // Add to job mapping
    if (!this.jobProcesses.has(jobId)) {
      this.jobProcesses.set(jobId, new Set());
    }
    this.jobProcesses.get(jobId).add(pid);
    
    // Add to global tracking
    this.allProcesses.set(pid, {
      jobId,
      pid,
      startTime: Date.now(),
      ...processInfo
    });
    
    this.globalProcesses.add(pid);
  }

  /**
   * Unregister a process
   */
  unregisterProcess(pid) {
    const processInfo = this.allProcesses.get(pid);
    if (processInfo) {
      const jobId = processInfo.jobId;
      const jobPids = this.jobProcesses.get(jobId);
      if (jobPids) {
        jobPids.delete(pid);
        if (jobPids.size === 0) {
          this.jobProcesses.delete(jobId);
        }
      }
    }
    this.allProcesses.delete(pid);
    this.globalProcesses.delete(pid);
  }

  /**
   * Kill all processes for a specific job
   */
  async killJobProcesses(jobId) {
    console.log(`[GlobalProcessManager] Killing all processes for job ${jobId}`);
    
    const pids = this.jobProcesses.get(jobId);
    if (!pids || pids.size === 0) {
      console.log(`[GlobalProcessManager] No processes found for job ${jobId}`);
      return 0;
    }
    
    console.log(`[GlobalProcessManager] Found ${pids.size} processes for job ${jobId}: ${Array.from(pids).join(', ')}`);
    
    let killedCount = 0;
    for (const pid of pids) {
      if (this.killProcess(pid)) {
        killedCount++;
      }
    }
    
    // Clean up tracking
    this.jobProcesses.delete(jobId);
    
    console.log(`[GlobalProcessManager] Killed ${killedCount} processes for job ${jobId}`);
    return killedCount;
  }

  /**
   * Kill a specific process by PID
   */
  killProcess(pid) {
    try {
      console.log(`[GlobalProcessManager] Attempting to kill PID ${pid}`);
      
      if (process.platform === 'win32') {
        execSync(`taskkill /F /PID ${pid} /T 2>nul || exit 0`, { stdio: 'ignore' });
      } else {
        // First try normal kill
        try {
          process.kill(pid, 'SIGKILL');
          console.log(`[GlobalProcessManager] Sent SIGKILL to PID ${pid}`);
        } catch (e) {
          console.log(`[GlobalProcessManager] process.kill failed for PID ${pid}:`, e.message);
        }
        
        // Then kill any children
        try {
          execSync(`pkill -9 -P ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
        } catch (e) {
          // Ignore
        }
        
        // Finally try direct kill command
        try {
          execSync(`kill -9 ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
        } catch (e) {
          // Ignore
        }
      }
      
      this.unregisterProcess(pid);
      console.log(`[GlobalProcessManager] Process ${pid} kill attempted`);
      return true;
    } catch (error) {
      console.error(`[GlobalProcessManager] Error killing PID ${pid}:`, error.message);
      // Process might already be dead
      this.unregisterProcess(pid);
      return false;
    }
  }

  /**
   * Kill ALL tracked FFmpeg processes (emergency stop)
   */
  killAllProcesses() {
    console.log(`[GlobalProcessManager] Emergency kill of ALL ${this.globalProcesses.size} tracked processes`);
    
    const allPids = Array.from(this.globalProcesses);
    let killedCount = 0;
    
    for (const pid of allPids) {
      if (this.killProcess(pid)) {
        killedCount++;
      }
    }
    
    // Clear all tracking
    this.jobProcesses.clear();
    this.allProcesses.clear();
    this.globalProcesses.clear();
    
    console.log(`[GlobalProcessManager] Emergency kill completed. Killed ${killedCount} processes`);
    return killedCount;
  }

  /**
   * Get status of all tracked processes
   */
  getStatus() {
    return {
      totalProcesses: this.globalProcesses.size,
      jobCount: this.jobProcesses.size,
      jobs: Array.from(this.jobProcesses.entries()).map(([jobId, pids]) => ({
        jobId,
        processCount: pids.size,
        pids: Array.from(pids)
      }))
    };
  }
}

// Create singleton instance
export const globalProcessManager = new GlobalProcessManager();

// Export for debugging
global.__processManager = globalProcessManager;