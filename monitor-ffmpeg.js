#!/usr/bin/env node

/**
 * Monitor FFmpeg processes in real-time
 * Shows process creation and termination
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

let previousPids = new Set();

async function getFFmpegProcesses() {
  try {
    const { stdout } = await execAsync('ps aux | grep -v grep | grep ffmpeg || true');
    const lines = stdout.trim().split('\n').filter(line => line);
    return lines.map(line => {
      const parts = line.split(/\s+/);
      const fullCommand = parts.slice(10).join(' ');
      const pid = parts[1];
      return {
        pid,
        cpu: parts[2],
        mem: parts[3],
        command: fullCommand.substring(0, 80),
        isOurs: fullCommand.includes('framesend-app') || 
                fullCommand.includes(path.join(os.homedir(), 'Library/Application Support/framesend-app'))
      };
    });
  } catch (e) {
    return [];
  }
}

async function monitor() {
  console.log('Monitoring FFmpeg processes... (Press Ctrl+C to stop)\n');
  
  setInterval(async () => {
    const processes = await getFFmpegProcesses();
    const currentPids = new Set(processes.map(p => p.pid));
    
    // Check for new processes
    for (const process of processes) {
      if (!previousPids.has(process.pid)) {
        const marker = process.isOurs ? '★' : '○';
        console.log(`${new Date().toISOString()} [NEW] ${marker} PID ${process.pid}: ${process.command}`);
      }
    }
    
    // Check for terminated processes
    for (const pid of previousPids) {
      if (!currentPids.has(pid)) {
        console.log(`${new Date().toISOString()} [TERMINATED] PID ${pid}`);
      }
    }
    
    // Update previous PIDs
    previousPids = currentPids;
    
    // Show count
    if (processes.length > 0) {
      const ourCount = processes.filter(p => p.isOurs).length;
      process.stdout.write(`\rActive: ${processes.length} total (${ourCount} Framesend)  `);
    }
  }, 500); // Check every 500ms
}

// Run the monitor
monitor().catch(console.error);