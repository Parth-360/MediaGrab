// ============================================================
//  YouTube Music Service
//  Search: YTM InnerTube API (recursive extraction)
//  Download: cobalt.tools via streamResolver
// ============================================================

const YTM_BASE = 'https://music.youtube.com/youtubei/v1';
const YTM_KEY  = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';

const YTM_CTX = {
  client: {
    clientName:    'WEB_REMIX',
    clientVersion: '1.20240304.01.00',
    hl: 'en', gl: 'US',
  },
};

async function ytmFetch(endpoint, body) {
  const res = await fetch(`${YTM_BASE}/${endpoint}?key=${YTM_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type':             'application/json',
      'User-Agent':               'Mozilla/5.0',
      'X-YouTube-Client-Name':    '67',
      'X-YouTube-Client-Version': YTM_CTX.client.clientVersion,
      'Origin':                   'https://music.youtube.com',
      'Referer':                  'https://music.youtube.com/',
    },
    body: JSON.stringify({ context: YTM_CTX, ...body }),
  });
  if (!res.ok) throw new Error(`YTM ${endpoint}: ${res.status}`);
  return res.json();
}

// ── Recursive extractor ────────────────────────────────────

function extractAll(obj, key, depth = 0) {
  if (!obj || depth > 15) return [];
  const results = [];
  if (obj[key] !== undefined) results.push(obj[key]);
  if (Array.isArray(obj)) {
    for (const item of obj) results.push(...extractAll(item, key, depth + 1));
  } else if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      if (k !== key) results.push(...extractAll(obj[k], key, depth + 1));
    }
  }
  return results;
}

function parseText(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (obj.simpleText) return obj.simpleText;
  if (obj.runs) return obj.runs.map((r) => r.text || '').join('');
  return '';
}

function bestThumb(arr = []) {
  if (!arr?.length) return '';
  return [...arr].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
}

function parseDuration(str = '') {
  const p = String(str).split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

function parseListItem(r) {
  if (!r) return null;

  // Try to get videoId from multiple paths
  const videoId =
    r.playlistItemData?.videoId ||
    r.overlay?.musicItemThumbnailOverlayRenderer
     ?.content?.musicPlayButtonRenderer
     ?.playNavigationEndpoint?.watchEndpoint?.videoId ||
    r.navigationEndpoint?.watchEndpoint?.videoId;

  if (!videoId) return null;

  const cols    = r.flexColumns || [];
  const title   = parseText(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
               || parseText(r.title);
  const subRuns = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
  const artist  = subRuns[0]?.text || 'Unknown';
  const album   = subRuns[2]?.text || '';
  const durStr  = subRuns[subRuns.length - 1]?.text || '0:00';

  const thumbs  =
    r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
    r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];

  return {
    id:        videoId,
    title:     title || 'Unknown',
    artist,
    album,
    thumbnail: bestThumb(thumbs),
    albumArt:  bestThumb(thumbs),
    duration:  parseDuration(durStr),
    source:    'youtubeMusic',
  };
}

// ── Search ─────────────────────────────────────────────────

export async function searchYouTubeMusic(query) {
  try {
    const data = await ytmFetch('search', {
      query,
      params: 'EgWKAQIIAWoKEAoQCRADEAQQBQ%3D%3D', // songs filter
    });

    // Recursively extract all musicResponsiveListItemRenderer
    const renderers = extractAll(data, 'musicResponsiveListItemRenderer');
    const tracks    = renderers.map(parseListItem).filter(Boolean);

    // Deduplicate by videoId
    const seen = new Set();
    return tracks.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  } catch (err) {
    console.error('YTM search error:', err);
    throw new Error('YouTube Music search failed. Check your connection.');
  }
}

// ── Charts ─────────────────────────────────────────────────

export async function getYouTubeMusicCharts() {
  try {
    const data = await ytmFetch('browse', { browseId: 'FEmusic_charts' });
    const renderers = extractAll(data, 'musicResponsiveListItemRenderer');
    const tracks    = renderers.map(parseListItem).filter(Boolean);
    const seen      = new Set();
    return tracks
      .filter((t) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; })
      .slice(0, 25);
  } catch (err) {
    console.error('YTM charts error:', err);
    // Fallback: search for popular music
    try {
      return await searchYouTubeMusic('top hits 2024');
    } catch (_) {
      return [];
    }
  }
}
