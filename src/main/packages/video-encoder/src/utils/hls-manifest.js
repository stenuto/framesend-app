import fs from 'fs-extra';
import path from 'path';

/**
 * Generate HLS master manifest
 * @param {string} outputPath - Path to write master.m3u8
 * @param {Array} renditions - Array of encoded renditions
 * @param {Object} metadata - Video metadata
 */
export async function generateHLSManifest(outputPath, renditions, metadata) {
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:6',
    '#EXT-X-INDEPENDENT-SEGMENTS',
    '',
  ];
  
  // Audio is embedded in video streams, no external audio groups needed
  
  // Add subtitle group if captions exist
  if (metadata.captions) {
    lines.push(
      '# Subtitles',
      '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",DEFAULT=YES,AUTOSELECT=YES,LANGUAGE="en",URI="captions/captions.vtt"',
      ''
    );
  }
  
  // Group renditions by codec
  const h264Renditions = renditions.filter(r => r.codec === 'h264' || !r.codec);
  // Note: AV1 is currently not supported by HLS.js/hls-video-element, so we exclude it from manifest
  // The files are still created but won't be referenced in the playlist
  const av1Renditions = []; // renditions.filter(r => r.codec === 'av1' || r.codec === 'libsvtav1');
  
  // Sort by bandwidth (lowest first) - HLS spec requires ascending order
  const sortByBandwidth = (a, b) => {
    const aBandwidth = a.actualBitrate || parseInt(a.maxrate.replace('k', '')) * 1000;
    const bBandwidth = b.actualBitrate || parseInt(b.maxrate.replace('k', '')) * 1000;
    return aBandwidth - bBandwidth;
  };
  
  // Add H.264 variants first
  if (h264Renditions.length > 0) {
    lines.push('# H.264 Variants');
    h264Renditions.sort(sortByBandwidth);
    
    for (const rendition of h264Renditions) {
    // Use actual bitrate if available, otherwise fall back to maxrate
    let videoBandwidth;
    if (rendition.actualBitrate) {
      // Use the actual encoded bitrate
      videoBandwidth = rendition.actualBitrate;
      console.log(`[HLS Manifest] Using actual bitrate for ${rendition.name}: ${Math.round(videoBandwidth/1000)}k`);
    } else {
      // Fall back to maxrate
      videoBandwidth = parseInt(rendition.maxrate.replace('k', '')) * 1000;
      console.log(`[HLS Manifest] Using maxrate for ${rendition.name}: ${Math.round(videoBandwidth/1000)}k`);
    }
    
    const audioBandwidth = rendition.audioUpgrade ? 192000 : 128000;
    const bandwidth = videoBandwidth + audioBandwidth;
    
    // Determine codecs string
    const videoCodec = getVideoCodecString(rendition);
    const audioCodec = metadata.audio ? ',mp4a.40.2' : '';
    const codecs = `${videoCodec}${audioCodec}`;
    
    // Calculate average bandwidth (use 90% of peak for conservative estimate)
    const averageBandwidth = Math.round(bandwidth * 0.9);
    
    // Build variant stream info
    const streamInfo = [
      `BANDWIDTH=${bandwidth}`,
      `AVERAGE-BANDWIDTH=${averageBandwidth}`,
      `RESOLUTION=${rendition.width}x${rendition.height}`,
      `CODECS="${codecs}"`,
      `FRAME-RATE=${metadata.video.frameRate.toFixed(3)}`,
      'CLOSED-CAPTIONS=NONE'
    ];
    
    if (metadata.captions) {
      streamInfo.push('SUBTITLES="subs"');
    }
    
    lines.push(
      `#EXT-X-STREAM-INF:${streamInfo.join(',')}`,
      rendition.playlistPath,
      ''
    );
    }
  }
  
  // Add AV1 variants as alternative renditions
  if (av1Renditions.length > 0) {
    lines.push('# AV1 Variants');
    av1Renditions.sort(sortByBandwidth);
    
    for (const rendition of av1Renditions) {
      // Use actual bitrate if available, otherwise fall back to maxrate
      let videoBandwidth;
      if (rendition.actualBitrate) {
        // Use the actual encoded bitrate
        videoBandwidth = rendition.actualBitrate;
        console.log(`[HLS Manifest] Using actual bitrate for AV1 ${rendition.name}: ${Math.round(videoBandwidth/1000)}k`);
      } else {
        // Fall back to maxrate
        videoBandwidth = parseInt(rendition.maxrate.replace('k', '')) * 1000;
        console.log(`[HLS Manifest] Using maxrate for AV1 ${rendition.name}: ${Math.round(videoBandwidth/1000)}k`);
      }
      
      const audioBandwidth = rendition.audioUpgrade ? 192000 : 128000;
      const bandwidth = videoBandwidth + audioBandwidth;
      
      const videoCodec = 'av01.0.08M.10'; // AV1 Main Profile, Level 4.0, 10-bit
      const audioCodec = metadata.audio ? ',mp4a.40.2' : '';
      
      // Calculate average bandwidth
      const averageBandwidth = Math.round(bandwidth * 0.9);
      
      const streamInfo = [
        `BANDWIDTH=${bandwidth}`,
        `AVERAGE-BANDWIDTH=${averageBandwidth}`,
        `RESOLUTION=${rendition.width}x${rendition.height}`,
        `CODECS="${videoCodec}${audioCodec}"`,
        `FRAME-RATE=${metadata.video.frameRate.toFixed(3)}`,
        'CLOSED-CAPTIONS=NONE'
      ];
      
      lines.push(
        `#EXT-X-STREAM-INF:${streamInfo.join(',')}`,
        rendition.playlistPath,
        ''
      );
    }
  }
  
  // Write master manifest
  await fs.writeFile(outputPath, lines.join('\n'));
}

/**
 * Get H.264 codec string based on profile and level
 * @param {Object} rendition - Rendition info
 * @returns {string} Codec string
 */
function getVideoCodecString(rendition) {
  if (rendition.codec === 'av1') {
    // AV1 codec string: av01.{profile}.{level}{tier}.{bitDepth}
    return 'av01.0.08M.10'; // Main Profile, Level 4.0, Main tier, 10-bit
  }
  
  // H.264 codec string: avc1.{profile}{constraints}{level}
  const profileMap = {
    'baseline': '42',
    'main': '4d',
    'high': '64',
  };
  
  const profile = profileMap[rendition.profile] || '4d';
  const constraints = '00'; // No specific constraints
  const level = rendition.level ? rendition.level.replace('.', '') : '40';
  
  return `avc1.${profile}${constraints}${level}`;
}

/**
 * Generate WebVTT file for thumbnail storyboard
 * @param {string} outputPath - Path to write VTT file
 * @param {Object} storyboardData - Storyboard metadata
 * @param {string} storyboardUrl - URL/path to storyboard image
 */
export async function generateStoryboardVTT(outputPath, storyboardData, storyboardUrl) {
  const lines = ['WEBVTT', ''];
  
  const { interval, columns, thumbnailWidth, thumbnailHeight, count } = storyboardData;
  
  for (let i = 0; i < count; i++) {
    const startTime = i * interval;
    const endTime = (i + 1) * interval;
    
    // Calculate position in sprite
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = col * thumbnailWidth;
    const y = row * thumbnailHeight;
    
    // Format timestamps
    const start = formatVTTTime(startTime);
    const end = formatVTTTime(endTime);
    
    lines.push(
      `${start} --> ${end}`,
      `${storyboardUrl}#xywh=${x},${y},${thumbnailWidth},${thumbnailHeight}`,
      ''
    );
  }
  
  await fs.writeFile(outputPath, lines.join('\n'));
}

/**
 * Format seconds to WebVTT timestamp (HH:MM:SS.mmm)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp
 */
function formatVTTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toFixed(3).padStart(6, '0'),
  ].join(':');
}