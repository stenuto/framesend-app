#!/usr/bin/env node

/**
 * Test script to verify FFmpeg process killing works correctly
 * Run this while encoding is in progress to test the kill functionality
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

async function getFFmpegProcesses(filterOurs = false) {
  try {
    const { stdout } = await execAsync('ps aux | grep -v grep | grep ffmpeg || true');
    const lines = stdout.trim().split('\n').filter(line => line);
    const processes = lines.map(line => {
      const parts = line.split(/\s+/);
      const fullCommand = parts.slice(10).join(' ');
      return {
        pid: parts[1],
        cpu: parts[2],
        mem: parts[3],
        command: fullCommand.substring(0, 100),
        fullCommand: fullCommand,
        isOurs: fullCommand.includes('framesend-app') || 
                fullCommand.includes(path.join(os.homedir(), 'Library/Application Support/framesend-app'))
      };
    });
    
    return filterOurs ? processes.filter(p => p.isOurs) : processes;
  } catch (e) {
    return [];
  }
}

async function testKill() {
  console.log('=== FFmpeg Process Kill Test ===\n');
  
  // 1. Check current FFmpeg processes
  console.log('1. All FFmpeg processes:');
  let allProcesses = await getFFmpegProcesses();
  if (allProcesses.length === 0) {
    console.log('   No FFmpeg processes found. Start an encoding job first.');
    return;
  }
  
  allProcesses.forEach(p => {
    const marker = p.isOurs ? '★ OURS' : '  OTHER';
    console.log(`   ${marker} PID ${p.pid}: CPU ${p.cpu}%, MEM ${p.mem}% - ${p.command}`);
  });
  
  const ourProcesses = allProcesses.filter(p => p.isOurs);
  console.log(`\n   Total: ${allProcesses.length} processes (${ourProcesses.length} from Framesend)\n`);
  
  if (ourProcesses.length === 0) {
    console.log('   No Framesend FFmpeg processes found.');
    return;
  }
  
  // 2. Kill only our FFmpeg processes
  console.log('2. Killing only Framesend FFmpeg processes...');
  
  // Extract our output directories
  const framesendDir = path.join(os.homedir(), 'Library/Application Support/framesend-app');
  
  for (const proc of ourProcesses) {
    try {
      execSync(`kill -9 ${proc.pid} 2>/dev/null || true`, { stdio: 'ignore' });
      console.log(`   ✓ Killed PID ${proc.pid}`);
    } catch (e) {
      console.log(`   ✗ Failed to kill PID ${proc.pid}`);
    }
  }
  
  // 3. Wait a moment
  console.log('\n3. Waiting 1 second...\n');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. Check again
  console.log('4. Remaining FFmpeg processes:');
  allProcesses = await getFFmpegProcesses();
  const remainingOurs = allProcesses.filter(p => p.isOurs);
  
  if (allProcesses.length === 0) {
    console.log('   No FFmpeg processes remaining.');
  } else {
    console.log(`   Total: ${allProcesses.length} processes (${remainingOurs.length} from Framesend)`);
    allProcesses.forEach(p => {
      const marker = p.isOurs ? '★ OURS' : '  OTHER';
      console.log(`   ${marker} PID ${p.pid}: ${p.command}`);
    });
  }
  
  if (remainingOurs.length === 0) {
    console.log('\n   ✓ Success! All Framesend FFmpeg processes have been terminated.');
  } else {
    console.log('\n   ✗ Warning! Some Framesend processes are still running.');
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testKill().catch(console.error);