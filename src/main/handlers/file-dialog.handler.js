import { dialog } from 'electron';

/**
 * Register file dialog handlers
 */
export default function registerFileDialogHandlers(ipcMain, { BrowserWindow }) {
  /**
   * Select video files with full file paths
   */
  ipcMain.handle('video:selectFiles', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    
    const result = await dialog.showOpenDialog(window, {
      title: 'Select Video Files',
      filters: [
        { 
          name: 'Video Files', 
          extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv'] 
        },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile', 'multiSelections']
    });
    
    if (result.canceled) {
      return null;
    }
    
    // Return file paths and metadata
    const files = await Promise.all(result.filePaths.map(async (filePath) => {
      const fs = await import('fs');
      const path = await import('path');
      const stats = await fs.promises.stat(filePath);
      
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size
      };
    }));
    
    return files;
  });
}