import fs from 'fs-extra';
import path from 'path';

/**
 * Calculate the total size of a directory including all subdirectories and files
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<number>} Total size in bytes
 */
export async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    // Check if directory exists
    const exists = await fs.pathExists(dirPath);
    if (!exists) {
      return 0;
    }
    
    // Get directory stats
    const stats = await fs.stat(dirPath);
    
    if (stats.isFile()) {
      return stats.size;
    }
    
    if (stats.isDirectory()) {
      // Read all items in directory
      const items = await fs.readdir(dirPath);
      
      // Calculate size for each item
      const sizePromises = items.map(async (item) => {
        const itemPath = path.join(dirPath, item);
        try {
          const itemStats = await fs.stat(itemPath);
          
          if (itemStats.isFile()) {
            return itemStats.size;
          } else if (itemStats.isDirectory()) {
            // Recursively calculate subdirectory size
            return await getDirectorySize(itemPath);
          }
          
          return 0;
        } catch (error) {
          console.warn(`Failed to get size for ${itemPath}:`, error.message);
          return 0;
        }
      });
      
      const sizes = await Promise.all(sizePromises);
      totalSize = sizes.reduce((sum, size) => sum + size, 0);
    }
    
    return totalSize;
  } catch (error) {
    console.error(`Error calculating directory size for ${dirPath}:`, error);
    return 0;
  }
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}