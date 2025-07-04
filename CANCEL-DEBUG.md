# FFmpeg Cancel Debugging Guide

Since the cancel button is still not killing the processes, here's how to debug and fix the issue:

## 1. Check What's Running

In the renderer console, run:
```javascript
checkProcesses()
```

This will show:
- How many FFmpeg processes are running
- Which ones belong to Framesend (marked with ★)
- What the global manager is tracking

## 2. Check the Job ID

When you start encoding, look in the console for:
```
Starting job {jobId}
```

Make note of this job ID (e.g., `-08O-Xn4JvrLbhAy-pz-E`)

## 3. Manual Kill Test

While encoding is running, you can test killing directly:

### From Terminal:
```bash
# Kill all Framesend FFmpeg processes
./kill-all-ffmpeg.sh

# Kill specific job
./kill-all-ffmpeg.sh YOUR_JOB_ID
```

### From Console:
```javascript
// Check what's running
checkProcesses()

// Get job IDs from queue
debugQueue()

// Force kill a specific job
await window.api.video.forceKill('YOUR_JOB_ID')

// Emergency stop all
await window.api.video.emergencyStop()
```

## 4. What to Look For

When you click Cancel, you should see these logs:

**Renderer Console:**
- `[UI] Cancelling job {jobId} for file {filename}`
- `[UI] Force killing processes for job {jobId}`

**Main Process Console:**
- `[video:forceKill] Force killing processes for job {jobId}`
- `[FFmpegKiller] Killing processes for job {jobId}...`
- Process kill messages

## 5. Possible Issues

### Issue 1: Job ID Contains Special Characters
The job ID might contain characters that break the grep command. Check if the job ID has spaces or special characters.

### Issue 2: FFmpeg Binary Path
The FFmpeg processes might be running with a full path that doesn't match our search patterns.

### Issue 3: Process Not Associated with Job
The FFmpeg processes might not have the job ID in their command line.

## 6. Nuclear Options

If nothing else works:

### Option 1: Kill ALL FFmpeg (dangerous if you use FFmpeg for other things)
```bash
killall -9 ffmpeg
```

### Option 2: Use Activity Monitor
1. Open Activity Monitor
2. Search for "ffmpeg"
3. Select all FFmpeg processes
4. Click the X button to force quit

### Option 3: Emergency Stop Button
Click the red "Stop All" button in the UI

## 7. Verification

After killing, verify processes are gone:
```bash
ps aux | grep ffmpeg | grep -v grep
```

Or in console:
```javascript
checkProcesses()
```

## 8. The Real Issue

The problem appears to be that the FFmpeg processes are being started but not properly associated with the job ID in a way that our kill commands can find them. The processes show in the logs:

```
[FFmpeg] Started encoding process PID: 21847, Total active: 1
```

But when we try to kill by job ID, we can't find them. This suggests the job ID isn't in the FFmpeg command line or our search pattern isn't matching.

## 9. Quick Fix

For now, use the "Stop All" button which should kill all FFmpeg processes belonging to the app.