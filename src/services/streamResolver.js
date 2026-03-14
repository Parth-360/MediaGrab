// ============================================================
//  Stream Resolver — cobalt.tools backend
//
//  cobalt.tools is a free, open-source download service that
//  handles YouTube URL signature decryption (the hard part).
//  It supports YouTube, YouTube Music, and more.
//  No API key needed. https://github.com/imputnet/cobalt
// ============================================================

// Multiple cobalt instances for reliability
const COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt.api.timelessnesses.me',
  'https://co.eepy.cat',
];

const AUDIO_FORMATS = {
  '320': { audioBitrate: '320', audioFormat: 'mp3' },
  '256': { audioBitrate: '256', audioFormat: 'mp3' },
  '192': { audioBitrate: '192', audioFormat: 'mp3' },
  '128': { audioBitrate: '128', audioFormat: 'mp3' },
};

const VIDEO_QUALITIES = ['2160', '1440', '1080', '720', '480', '360'];

// ── Core resolver ─────────────────────────────────────────

async function cobaltRequest(youtubeUrl, options = {}) {
  const body = {
    url:           youtubeUrl,
    videoQuality:  options.videoQuality  || '1080',
    audioFormat:   options.audioFormat   || 'mp3',
    audioBitrate:  options.audioBitrate  || '320',
    downloadMode:  options.downloadMode  || 'auto',   // 'auto' | 'audio' | 'mute'
    filenameStyle: 'pretty',
  };

  let lastError;
  for (const base of COBALT_INSTANCES) {
    try {
      const res = await fetch(`${base}/`, {
        method: 'POST',
        headers: {
          'Accept':       'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        lastError = new Error(`Cobalt HTTP ${res.status} from ${base}`);
        continue;
      }

      const data = await res.json();

      if (data.status === 'error') {
        lastError = new Error(
          data.error?.code || data.error?.message || 'Cobalt returned an error',
        );
        continue;
      }

      // status: 'tunnel' | 'redirect' → direct download URL
      if (data.status === 'tunnel' || data.status === 'redirect') {
        return { url: data.url, filename: data.filename };
      }

      // status: 'picker' → multiple streams, pick best
      if (data.status === 'picker' && data.picker?.length) {
        const best = data.picker.sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
        return { url: best.url, filename: best.filename || data.filename };
      }

      lastError = new Error(`Unexpected cobalt status: ${data.status}`);
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError || new Error('All download servers failed. Check your internet connection.');
}

// ── Public API ────────────────────────────────────────────

/**
 * Get a direct audio download URL for a YouTube video.
 * Returns the highest quality audio (up to 320 kbps MP3).
 */
export async function resolveAudioUrl(videoId, qualityKey = '320') {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fmt   = AUDIO_FORMATS[qualityKey] || AUDIO_FORMATS['320'];
  return cobaltRequest(ytUrl, {
    downloadMode: 'audio',
    audioFormat:  fmt.audioFormat,
    audioBitrate: fmt.audioBitrate,
  });
}

/**
 * Get a direct video+audio download URL for a YouTube video.
 * Quality: '2160' | '1440' | '1080' | '720' | '480' | '360'
 */
export async function resolveVideoUrl(videoId, quality = '1080') {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return cobaltRequest(ytUrl, {
    downloadMode: 'auto',
    videoQuality: VIDEO_QUALITIES.includes(quality) ? quality : '1080',
    audioFormat:  'mp3',
    audioBitrate: '320',
  });
}

/**
 * Get a direct audio URL from a YouTube Music track.
 */
export async function resolveYTMusicUrl(videoId) {
  const ytmUrl = `https://music.youtube.com/watch?v=${videoId}`;
  return cobaltRequest(ytmUrl, {
    downloadMode: 'audio',
    audioFormat:  'mp3',
    audioBitrate: '320',
  }).catch(() =>
    // Fallback: try regular YouTube URL
    cobaltRequest(`https://www.youtube.com/watch?v=${videoId}`, {
      downloadMode: 'audio',
      audioFormat:  'mp3',
      audioBitrate: '320',
    }),
  );
}
