# Debugging FFmpeg Process Cancellation

## Current Implementation

When you click "Cancel" in the UI:

1. **UI Layer** (`upload.vue`):
   - `handleCancelJob()` shows confirmation dialog
   - Calls `videoStore.cancelJob(jobId)`
   - Removes item from queue after 1 second

2. **Store Layer** (`videoEncoding.js`):
   - `cancelJob()` calls `window.api.video.cancel(jobId)`
   - Updates job status to 'cancelled'

3. **IPC Handler** (`video-encoding.handler.js`):
   - Receives cancel request
   - Calls `service.cancelJob(jobId)`

4. **Service Layer** (`VideoEncodingService.js`):
   - Finds the active job
   - Calls `job.cancel()`
   - Removes from activeJobs

5. **Job Layer** (`VideoJob.js`):
   - Sets `cancelled = true`
   - Pauses encoding queue
   - Calls `this.ffmpeg.killAll()`

6. **FFmpeg Layer** (`ffmpeg-wrapper.js`):
   - Tracks all processes in a Map
   - Kills tracked PIDs and their children
   - Only targets processes working on our directories

## Debugging Steps

### 1. Monitor FFmpeg Processes
Run this in a separate terminal while encoding:
```bash
node monitor-ffmpeg.js
```

This shows:
- When FFmpeg processes are created (marked with ★ for Framesend)
- When processes are terminated
- Current count of active processes

### 2. Test Process Killing
While encoding is running, test the kill functionality:
```bash
node test-ffmpeg-kill.js
```

This will:
- Show all FFmpeg processes
- Identify which belong to Framesend
- Kill only Framesend processes
- Verify they were terminated

### 3. Check Console Logs
Look for these log messages when cancelling:

**Renderer Console:**
- `[UI] Cancelling job {jobId} for file {filename}`
- `[VideoStore] Cancelling job {jobId}`
- `[VideoStore] Job {jobId} cancelled successfully`

**Main Process Console:**
- `[video:cancel] Received cancel request for job {jobId}`
- `[VideoEncodingService] Attempting to cancel job {jobId}`
- `[VideoJob] Cancelling job {jobId}`
- `[FFmpeg] Starting comprehensive kill of X active processes`
- `[FFmpeg] Kill operation completed`

### 4. Common Issues

**Issue: Processes keep running after cancel**
- Check if the job ID is correct
- Verify the job exists in activeJobs
- Check if FFmpeg wrapper is tracking the processes

**Issue: Queue item disappears but encoding continues**
- The UI removes the item but backend might have failed
- Check main process logs for errors

**Issue: Other FFmpeg processes are killed**
- The current implementation only kills processes that:
  - Have PIDs we tracked when starting them
  - Are working on our output directories
  - Match our application paths

## Testing Checklist

1. Start an encoding job
2. Open Activity Monitor and filter for "ffmpeg"
3. Note the number of ffmpeg processes (should be ~6 for parallel encoding)
4. Click Cancel in the UI
5. Confirm the dialog
6. Check that:
   - [ ] Queue item is removed from UI
   - [ ] Console shows cancel logs
   - [ ] FFmpeg processes are terminated in Activity Monitor
   - [ ] No FFmpeg processes remain for that job
   - [ ] Other non-Framesend FFmpeg processes are unaffected

## If Processes Still Run

1. Check if the FFmpeg wrapper is properly tracking PIDs:
   - Look for `[FFmpeg] Started encoding process PID: {pid}` logs
   - Verify PIDs match what you see in Activity Monitor

2. Try manual cleanup while debugging:
   ```bash
   # See Framesend FFmpeg processes
   ps aux | grep ffmpeg | grep "framesend-app"
   
   # Kill a specific PID
   kill -9 <PID>
   ```

3. Check if child process tracking is working:
   - Look for `[FFmpeg] Found X child processes for PID` logs
   - These child processes should also be killed

## Code Locations

- UI Cancel Handler: `src/renderer/src/pages/upload.vue:308`
- Store Cancel: `src/renderer/src/stores/videoEncoding.js:236`
- IPC Handler: `src/main/handlers/video-encoding.handler.js:209`
- Service Cancel: `src/main/packages/video-encoder/src/core/VideoEncodingService.js:169`
- Job Cancel: `src/main/packages/video-encoder/src/core/VideoJob.js:599`
- FFmpeg Kill: `src/main/packages/video-encoder/src/utils/ffmpeg-wrapper.js:358`