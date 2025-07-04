# FFmpeg Process Cancellation Fix

## What Was Wrong
The cancel button was removing items from the UI but not killing the FFmpeg processes because:
1. The job tracking was getting lost between the UI and backend
2. Each VideoJob had its own FFmpeg wrapper instance with separate process tracking
3. The cancel request wasn't making it through the entire chain

## New Solution: Global Process Manager

I've implemented a completely new approach with a **Global Process Manager** that:

1. **Tracks ALL FFmpeg processes globally** across all jobs
2. **Registers processes immediately** when they start
3. **Can kill processes directly by job ID** without relying on complex job tracking
4. **Provides force kill and emergency stop** options

## How It Works Now

### Normal Cancel Flow:
1. Click Cancel → Confirmation dialog
2. Tries normal cancel through video store
3. **Always calls forceKill** to ensure processes are terminated
4. Removes from UI queue immediately

### Force Kill Method:
- Directly kills all processes associated with a job ID
- Doesn't rely on the job existing in the service
- Uses the global process manager

### Emergency Stop:
- New "Stop All" button appears when encoding is active
- Kills ALL FFmpeg processes immediately
- Clears all active jobs

## New Features

### 1. Debug Commands (in renderer console):
```javascript
// Check what processes are being tracked
checkProcesses()

// See video store state
debugVideoStore()

// See queue state  
debugQueue()
```

### 2. Process Registration
Every FFmpeg process is now registered globally with:
- Job ID
- Process ID (PID)
- Command type (encode, extractAudio, etc.)
- Output path

### 3. Multiple Kill Strategies
- Normal cancel (tries graceful shutdown)
- Force kill (kills by job ID)
- Emergency stop (kills everything)

## Testing the Fix

1. Start encoding a video
2. You'll see logs like:
   ```
   [GlobalProcessManager] Registering PID 12345 for job abc123
   ```

3. Click Cancel on a job
4. You'll see:
   ```
   [UI] Force killing processes for job abc123
   [GlobalProcessManager] Killing all processes for job abc123
   [GlobalProcessManager] Found 6 processes for job abc123: 12345, 12346...
   [GlobalProcessManager] Killed 6 processes for job abc123
   ```

5. Check Activity Monitor - FFmpeg processes should be gone

## If Cancel Still Doesn't Work

1. Use the "Stop All" button (red text) to kill everything
2. Run `checkProcesses()` in console to see what's tracked
3. Check main process console for error messages

## Key Changes Made

1. **Global Process Manager** (`global-process-manager.js`)
   - Singleton that tracks all processes
   - Can kill by job ID or kill everything

2. **Updated FFmpeg Wrapper**
   - Registers all processes with global manager
   - Passes job ID for tracking

3. **New IPC Handlers**
   - `video:forceKill` - Force kill by job ID
   - `video:emergencyStop` - Kill all processes
   - `video:processStatus` - Debug process tracking

4. **UI Updates**
   - Cancel always calls force kill
   - Added "Stop All" emergency button
   - Immediate UI feedback

This approach is much more robust because it doesn't rely on complex state management - it just tracks PIDs and kills them directly.