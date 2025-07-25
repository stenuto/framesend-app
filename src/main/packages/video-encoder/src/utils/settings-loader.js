import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_ENCODING_SETTINGS } from '../config/encoding-presets.js';

/**
 * Load encoding settings from user config or use defaults
 * @param {string} settingsPath - Path to settings file
 * @returns {Object} Encoding settings
 */
export async function loadEncodingSettings(settingsPath) {
  try {
    if (await fs.pathExists(settingsPath)) {
      console.log('[Settings] Loading encoding settings from:', settingsPath);
      const settings = await fs.readJson(settingsPath);
      
      // Extract encoding settings from the main settings object
      const encodingSettings = settings.encoding || DEFAULT_ENCODING_SETTINGS;
      console.log('[Settings] Loaded encoding settings:', JSON.stringify(encodingSettings));
      
      return encodingSettings;
    }
    
    // If no user settings, return defaults (don't create file since main app manages it)
    console.log('[Settings] No user settings found, using defaults');
    return DEFAULT_ENCODING_SETTINGS;
    
  } catch (error) {
    console.error('[Settings] Error loading settings:', error);
    return DEFAULT_ENCODING_SETTINGS;
  }
}

/**
 * Save encoding settings to user config
 * @param {string} settingsPath - Path to settings file
 * @param {Object} settings - Encoding settings to save
 */
export async function saveEncodingSettings(settingsPath, settings) {
  try {
    // Ensure directory exists
    const dir = path.dirname(settingsPath);
    await fs.ensureDir(dir);
    
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    console.log('[Settings] Saved encoding settings to:', settingsPath);
  } catch (error) {
    console.error('[Settings] Error saving settings:', error);
    console.error('[Settings] Stack:', error.stack);
  }
}

/**
 * Filter ladder rungs based on settings
 * @param {Array} ladder - Full ladder array (H264_LADDER or AV1_LADDER)
 * @param {Object} settings - Settings object with enabled rungs
 * @returns {Array} Filtered ladder with only enabled rungs
 */
export function filterLadderBySettings(ladder, settings) {
  return ladder.filter(rung => {
    const isEnabled = settings.rungs[rung.name];
    if (!isEnabled) {
      console.log(`[Settings] Skipping disabled rung: ${rung.name}`);
    }
    return isEnabled;
  });
}