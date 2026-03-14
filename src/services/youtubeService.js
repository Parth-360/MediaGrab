// ============================================================
//  YouTube Service — InnerTube API for search + metadata
//  Download URLs are handled by streamResolver.js (cobalt)
// ============================================================

const INNERTUBE_BASE = 'https://www.youtube.com/youtubei/v1';
const INNERTUBE_KEY  = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

const WEB_CONTEXT = {
  client: { clientName: 'WEB', clientVersion: '2.20240304.00.00', hl: 'en', gl: 'US' },
};

async function innerTube(endpoint, body) {
  const res = await fetch(`${INNERTUBE_BASE}/${endpoint}?key=${INNERTUBE_KEY}`, {
    method:  'POST',
    headers: {
      'Content-Type':             'application/json',
      'User-Agent':               'Mozilla/5.0 (Linux; Android 11; SM-G780G) AppleWebKit/537.36',
      'X-YouTube-Client-Name':    '1',
      'X-YouTube-Client-Version': WEB_CONTEXT.client.clientVersion,
      'Origin':                   'https://www.youtube.com',
    },
    body: JSON.stringify({ context: WEB_CONTEXT, ...body }),
  });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────

function parseText(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.simpleText) return obj.simpleText;
  if (obj.runs) return obj.runs.map((r) => r.text || '').join('');
  return '';
}

function bestThumb(thumbs = []) {
  if (!thumbs?.length) return '';
  return [...thumbs].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
}

function parseSecs(str = '') {
  if (!str) return 0;
  const p = String(str).split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return parseInt(str, 10) || 0;
}

// ── Recursive extractor ────────────────────────────────────
// Walks the entire response tree to find videoRenderer objects.
// This approach is immune to YouTube changing their response structure.

function extractAll(obj, key, depth = 0) {
  if (!obj || depth > 15) return [];
  const results = [];
  if (obj[key]) results.push(obj[key]);
  if (Array.isArray(obj)) {
    for (const item of obj) results.push(...extractAll(item, key, depth + 1));
  } else if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k !== key) results.push(...extractAll(obj[k], key, depth + 1));
    }
  }
  return results;
}

function parseVideoRenderer(v) {
  if (!v?.videoId) return null;
  return {
    id:           v.videoId,
    title:        parseText(v.title),
    thumbnail:    bestThumb(v.thumbnail?.thumbnails),
    duration:     parseSecs(parseText(v.lengthText)),
    views:        parseInt(parseText(v.viewCountText).replace(/\D/g, '') || '0', 10),
    uploaderName: parseText(v.ownerText || v.shortBylineText),
    uploadedDate: parseText(v.publishedTimeText),
    type:         'video',
  };
}

// ── Search ─────────────────────────────────────────────────

export async function searchYouTube(query) {
  try {
    const data = await innerTube('search', { query });

    // Recursively extract ALL videoRenderer objects from the response
    const renderers = extractAll(data, 'videoRenderer');
    const results   = renderers
      .map(parseVideoRenderer)
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i); // deduplicate

    if (results.length === 0) {
      // Fallback: try extracting richItemRenderer > videoRenderer
      const richItems = extractAll(data, 'richItemRenderer');
      for (const item of richItems) {
        const v = item?.content?.videoRenderer;
        const parsed = parseVideoRenderer(v);
        if (parsed) results.push(parsed);
      }
    }

    return results;
  } catch (err) {
    console.error('YouTube search error:', err);
    throw new Error('YouTube search failed. Check your internet connection.');
  }
}

// ── Video metadata (title, thumbnail, duration) ───────────

export async function getVideoMeta(videoId) {
  try {
    const data = await innerTube('player', {
      videoId,
      context: {
        client: {
          clientName:    'WEB',
          clientVersion: '2.20240304.00.00',
          hl: 'en', gl: 'US',
        },
      },
    });
    const d = data.videoDetails || {};
    return {
      id:           videoId,
      title:        d.title           || 'Unknown',
      thumbnail:    bestThumb(d.thumbnail?.thumbnails),
      duration:     parseInt(d.lengthSeconds || '0', 10),
      views:        parseInt(d.viewCount     || '0', 10),
      uploaderName: d.author          || 'Unknown',
      description:  d.shortDescription || '',
    };
  } catch (err) {
    console.error('getVideoMeta error:', err);
    return { id: videoId, title: 'Unknown', thumbnail: '', duration: 0, views: 0, uploaderName: '' };
  }
}

// ── Trending ───────────────────────────────────────────────

export async function getTrending() {
  try {
    const data = await innerTube('browse', { browseId: 'FEtrending' });
    const renderers = extractAll(data, 'videoRenderer');
    return renderers
      .map(parseVideoRenderer)
      .filter(Boolean)
      .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
      .slice(0, 20);
  } catch (err) {
    console.error('Trending error:', err);
    return [];
  }
}

// ── Helper to extract video ID from URL ───────────────────

export function extractVideoId(url = '') {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
