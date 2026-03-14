// ============================================================
//  Stream Resolver — loader.to backend
//
//  loader.to is a free YouTube → MP3/MP4 conversion service.
//  It handles all YouTube signature decryption internally.
//
//  Flow:
//   1. GET https://loader.to/ajax/download.php?format=FORMAT&url=YT_URL
//      → { success: true, id: 'DOWNLOAD_ID', info: { image, title } }
//
//   2. Poll GET https://p.savenow.to/api/progress?id=DOWNLOAD_ID
//      every 2.5 s until download_url is populated (up to 90 s)
//
//   3. Return { url: download_url, filename }
// ============================================================

const LOADER_BASE    = 'https://loader.to/ajax/download.php';
const PROGRESS_BASE  = 'https://p.savenow.to/api/progress';

const POLL_MS    = 2500;   // poll every 2.5 seconds
const MAX_POLLS  = 36;     // 90 seconds max before giving up

// Shared fetch headers — mimic a mobile browser
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G780G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Accept':     'application/json, text/plain, */*',
  'Referer':    'https://loader.to/',
  'Origin':     'https://loader.to',
};

// ── Step 1: Request conversion ────────────────────────────

async function requestConversion(ytUrl, format) {
  const endpoint = `${LOADER_BASE}?format=${encodeURIComponent(format)}&url=${encodeURIComponent(ytUrl)}`;

  const res = await fetch(endpoint, { headers: HEADERS });
  if (!res.ok) throw new Error(`Conversion service error (HTTP ${res.status}). Try again.`);

  const data = await res.json();
  if (!data.success || !data.id) {
    throw new Error('Conversion service rejected this URL. Please try again.');
  }
  return data.id;
}

// ── Step 2: Poll until download_url is ready ─────────────

async function pollForUrl(downloadId) {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    // Wait before polling (give the server time to process)
    await new Promise((r) => setTimeout(r, POLL_MS));

    try {
      const res = await fetch(`${PROGRESS_BASE}?id=${downloadId}`);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.download_url) return data.download_url;
    } catch (_) {
      // Network blip — keep polling
    }
  }

  throw new Error(
    'Download preparation timed out (90 s). Check your internet connection and try again.',
  );
}

// ── Internal: resolve a YouTube URL with a given format ──

async function resolveUrl(ytUrl, format) {
  const id  = await requestConversion(ytUrl, format);
  const url = await pollForUrl(id);
  return url;
}

// ── Public API ────────────────────────────────────────────

/**
 * Get a direct MP3 download URL for a YouTube video ID.
 * loader.to always returns the best available MP3 quality.
 */
export async function resolveAudioUrl(videoId) {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const url   = await resolveUrl(ytUrl, 'mp3');
  return { url, filename: `audio_${videoId}.mp3` };
}

/**
 * Get a direct MP4 video download URL for a YouTube video ID.
 * Tries quality-specific format first; falls back to generic mp4.
 *
 * @param {string} videoId  - YouTube video ID
 * @param {string} quality  - '1080' | '720' | '480' | '360'
 */
export async function resolveVideoUrl(videoId, quality = '1080') {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Try the requested quality first, then fall back to best available
  const formatsToTry = [`mp4-${quality}`, 'mp4-1080', 'mp4'];
  const seen = new Set();
  let lastErr;

  for (const fmt of formatsToTry) {
    if (seen.has(fmt)) continue;
    seen.add(fmt);
    try {
      const url = await resolveUrl(ytUrl, fmt);
      return { url, filename: `video_${videoId}.mp4` };
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Could not get a video download link. Please try again.');
}

/**
 * Get a direct MP3 download URL for a YouTube Music track.
 */
export async function resolveYTMusicUrl(videoId) {
  return resolveAudioUrl(videoId);
}
