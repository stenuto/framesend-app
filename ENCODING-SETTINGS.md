# Encoding Settings Configuration

The encoding pipeline now supports customizable encoding ladders through a JSON configuration file.

## Settings Location

The encoding settings file is automatically created at:
- **macOS**: `~/Library/Application Support/framesend-app/encoding-settings.json`
- **Windows**: `%APPDATA%/framesend-app/encoding-settings.json`
- **Linux**: `~/.config/framesend-app/encoding-settings.json`

## Configuration Structure

```json
{
  "h264": {
    "enabled": true,
    "rungs": {
      "360p": true,
      "540p": false,
      "720p": true,
      "1080p": false,
      "1440p": true,
      "2160p": false
    }
  },
  "av1": {
    "enabled": true,
    "rungs": {
      "720p": false,
      "1080p": false,
      "1440p": false,
      "2160p": true
    }
  }
}
```

## Settings Explained

### Codec Enable/Disable
- `h264.enabled`: Set to `false` to disable all H.264 encoding
- `av1.enabled`: Set to `false` to disable all AV1 encoding

### Rung Selection
Each rung can be individually enabled/disabled:
- `true`: The rung will be encoded (if source video is high enough resolution)
- `false`: The rung will be skipped

## Aspect Ratio Aware Encoding

All rungs respect the source video's aspect ratio:
- **Heights are fixed** (360p, 720p, etc.)
- **Widths are calculated** to maintain aspect ratio
- **Bitrates are calculated** based on actual pixel count (width × height)

This means:
- A 1:1 square video at 720p will be encoded as 720×720
- A 16:9 video at 720p will be encoded as 1280×720
- A 9:16 portrait video at 720p will be encoded as 405×720

The bitrate automatically adjusts based on pixel count, so square videos get higher bitrates than landscape videos at the same height.

## Example Configurations

### Fast encoding (minimal rungs):
```json
{
  "h264": {
    "enabled": true,
    "rungs": {
      "360p": true,
      "540p": false,
      "720p": true,
      "1080p": false,
      "1440p": false,
      "2160p": false
    }
  },
  "av1": {
    "enabled": false,
    "rungs": {}
  }
}
```

### High quality (all rungs):
```json
{
  "h264": {
    "enabled": true,
    "rungs": {
      "360p": true,
      "540p": true,
      "720p": true,
      "1080p": true,
      "1440p": true,
      "2160p": true
    }
  },
  "av1": {
    "enabled": true,
    "rungs": {
      "720p": true,
      "1080p": true,
      "1440p": true,
      "2160p": true
    }
  }
}
```

### AV1-only for modern players:
```json
{
  "h264": {
    "enabled": false,
    "rungs": {}
  },
  "av1": {
    "enabled": true,
    "rungs": {
      "720p": true,
      "1080p": true,
      "1440p": true,
      "2160p": true
    }
  }
}
```

## Applying Changes

Changes to the settings file are applied on the next encoding job. No need to restart the application.