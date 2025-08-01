import { dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';

/**
 * Register video thumbnail handlers
 */
export default function registerVideoThumbnailHandlers(ipcMain, { BrowserWindow }) {
  /**
   * Upload a thumbnail image for a video
   */
  ipcMain.handle('video:uploadThumbnail', async (event, { videoId }) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    
    // Show file dialog for image selection
    const result = await dialog.showOpenDialog(window, {
      title: 'Select Thumbnail Image',
      filters: [
        { 
          name: 'Image Files', 
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] 
        },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled) {
      return null;
    }
    
    // Get file info
    const filePath = result.filePaths[0];
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    
    // Mock API call
    console.log(`📡 PUT /api/videos/${videoId}/thumbnail`);
    console.log('Request body:', {
      type: 'hero',
      path: filePath,
      fileName: fileName,
      size: stats.size,
      timestamp: new Date().toISOString()
    });
    
    // Simulate API response after a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockResponse = {
      success: true,
      data: {
        videoId: videoId,
        thumbnailUrl: `https://cdn.framesend.com/${videoId}/thumbnails/hero_4k.jpg`,
        type: 'hero',
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log('Response:', mockResponse);
    console.log(`✅ Thumbnail uploaded successfully for video ${videoId}`);
    
    return mockResponse;
  });

  /**
   * Set current frame as thumbnail
   */
  ipcMain.handle('video:setFrameAsThumbnail', async (event, { videoId, timestamp }) => {
    // Mock API call
    console.log(`📡 PUT /api/videos/${videoId}/thumbnail`);
    console.log('Request body:', {
      type: 'frame',
      timestamp: timestamp,
      generatedAt: new Date().toISOString()
    });
    
    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResponse = {
      success: true,
      data: {
        videoId: videoId,
        thumbnailUrl: `https://cdn.framesend.com/${videoId}/thumbnails/frame_${timestamp}.jpg`,
        type: 'frame',
        timestamp: timestamp,
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log('Response:', mockResponse);
    console.log(`✅ Frame thumbnail set successfully for video ${videoId} at ${timestamp}s`);
    
    return mockResponse;
  });

  /**
   * Copy current frame to clipboard
   */
  ipcMain.handle('video:copyFrameToClipboard', async (event, { videoId, timestamp }) => {
    // In a real implementation, we would extract the frame and copy to clipboard
    console.log(`📋 Copying frame from video ${videoId} at ${timestamp}s to clipboard`);
    
    return {
      success: true,
      message: 'Frame copied to clipboard'
    };
  });
}