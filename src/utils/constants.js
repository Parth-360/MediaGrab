export const QUALITY_OPTIONS = {
  video: [
    { label: '4K (2160p)', value: '2160', bitrate: '20000k' },
    { label: '1080p Full HD', value: '1080', bitrate: '8000k' },
    { label: '720p HD', value: '720', bitrate: '5000k' },
    { label: '480p SD', value: '480', bitrate: '2500k' },
    { label: '360p', value: '360', bitrate: '1000k' },
  ],
  audio: [
    { label: '320 kbps (Best)', value: '320', format: 'mp3' },
    { label: '256 kbps (High)', value: '256', format: 'mp3' },
    { label: '192 kbps (Good)', value: '192', format: 'mp3' },
    { label: '128 kbps (Normal)', value: '128', format: 'mp3' },
  ],
};

export const DOWNLOAD_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
};

export const MEDIA_TYPE = {
  VIDEO: 'video',
  AUDIO: 'audio',
};

export const SOURCE_TYPE = {
  YOUTUBE: 'youtube',
  SPOTIFY: 'spotify',
};

// Invidious public API instances for YouTube data
export const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.snopyta.org',
  'https://yewtu.be',
  'https://invidious.kavin.rocks',
  'https://inv.riverside.rocks',
];

// Piped API instances (alternative)
export const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api-piped.mha.fi',
  'https://piped-api.privacy.com.de',
];

export const APP_CONFIG = {
  name: 'MediaGrab',
  version: '1.0.0',
  maxConcurrentDownloads: 3,
  downloadChunkSize: 1024 * 1024, // 1MB chunks
  defaultVideoQuality: '1080',
  defaultAudioQuality: '320',
  supportedVideoFormats: ['mp4', 'webm', 'mkv'],
  supportedAudioFormats: ['mp3', 'flac', 'opus', 'm4a'],
};
