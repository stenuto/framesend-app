import { app } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { nanoid } from 'nanoid';

/**
 * Register temporary file handlers for drag-and-drop
 */
export default function registerFileTempHandlers(ipcMain) {
  // Clean up old temp files on startup
  const cleanupOldTempFiles = async () => {
    try {
      const tempUploadsDir = path.join(app.getPath('userData'), 'temp-uploads');
      if (await fs.pathExists(tempUploadsDir)) {
        const dirs = await fs.readdir(tempUploadsDir);
        const now = Date.now();
        
        for (const dir of dirs) {
          const dirPath = path.join(tempUploadsDir, dir);
          const stats = await fs.stat(dirPath);
          
          // Remove directories older than 24 hours
          if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
            await fs.remove(dirPath);
            console.log('Cleaned up old temp directory:', dir);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old temp files:', error);
    }
  };
  
  // Run cleanup on startup
  cleanupOldTempFiles();

  /**
   * Save a file buffer to a temporary location and return the path
   */
  ipcMain.handle('file:saveTemp', async (event, { name, buffer }) => {
    try {
      // Create temp directory in userData folder
      const tempDir = path.join(app.getPath('userData'), 'temp-uploads', nanoid());
      await fs.ensureDir(tempDir);
      
      // Save file to temp location
      const filePath = path.join(tempDir, name);
      await fs.writeFile(filePath, Buffer.from(buffer));
      
      // Return the temporary file path
      return {
        success: true,
        path: filePath
      };
    } catch (error) {
      console.error('Error saving temp file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  /**
   * Clean up temporary files
   */
  ipcMain.handle('file:cleanTemp', async (event, filePath) => {
    try {
      // Get the session directory (parent of the file)
      const sessionDir = path.dirname(filePath);
      
      // Remove the entire session directory
      if (sessionDir.includes('temp-uploads')) {
        await fs.remove(sessionDir);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error cleaning temp file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  /**
   * Read image file and convert to data URL
   */
  ipcMain.handle('file:readImage', async (event, filePath) => {
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        console.error('[file:readImage] File does not exist:', filePath);
        return null;
      }
      
      // Get file stats to ensure it's readable
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        console.error('[file:readImage] File is empty:', filePath);
        return null;
      }
      
      const buffer = await fs.readFile(filePath);
      const base64 = buffer.toString('base64');
      const mimeType = 'image/jpeg'; // Thumbnails are JPEGs
      const dataUrl = `data:${mimeType};base64,${base64}`;
      return dataUrl;
    } catch (error) {
      console.error('[file:readImage] Failed to read image:', error);
      return null;
    }
  });
}