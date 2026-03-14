// ============================================================
//  YouTube Music Service
//  Uses YouTube Music's InnerTube API to search and stream
//  music tracks in the highest available quality.
// ============================================================

import { getVideoInfo, getBestAudioStream } from './youtubeService';

const YTM_BASE = 'https://music.youtube.com/youtubei/v1';
const YTM_KEY  = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';

const YTM_CONTEXT = {
  client: {
    clientName:    'WEB_REMIX',
    clientVersion: '1.20240304.01.00',
    hl: 'en',
    gl: 'US',
  },
};

async function ytmFetch(endpoint, body) {
  const res = await fetch(`${YTM_BASE}/${endpoint}?key=${YTM_KEY}`, {
    method:  'POST',
    headers: {
      'Content-Type':             'application/json',
      'User-Agent':               'Mozilla/5.0',
      'X-YouTube-Client-Name':    '67',
      'X-YouTube-Client-Version': YTM_CONTEXT.client.clientVersion,
      'Origin':                   'https://music.youtube.com',
      'Referer':                  'https://music.youtube.com/',
    },
    body: JSON.stringify({ context: YTM_CONTEXT, ...body }),
  });
  if (!res.ok) throw new Error(`YTM ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ── helpers ───────────────────────────────────────────────

function parseRuns(obj) {
  if (!obj) return '';
  return obj?.runs?.map((r) => r.text).join('') || obj?.simpleText || '';
}

function parseThumbnail(thumbnails = []) {
  return [...thumbnails]
    .sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
}

function parseDurationSecs(str = '') {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// ── Search ─────────────────────────────────────────────────

export async function searchYouTubeMusic(query) {
  try {
    const data = await ytmFetch('search', {
      query,
      params: 'EgWKAQIIAWoKEAoQCRADEAQQBQ%3D%3D', // filter: Songs
    });

    const tracks = [];
    const contents =
      data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]
           ?.tabRenderer?.content?.sectionListRenderer?.contents || [];

    for (const section of contents) {
      const items =
        section?.musicShelfRenderer?.contents || [];
      for (const item of items) {
        const r = item?.musicResponsiveListItemRenderer;
        if (!r) continue;

        const videoId =
          r.playlistItemData?.videoId ||
          r.overlay?.musicItemThumbnailOverlayRenderer
           ?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
           ?.watchEndpoint?.videoId;

        if (!videoId) continue;

        const cols     = r.flexColumns || [];
        const title    = parseRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text);
        const subtitle = cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text;
        const subRuns  = subtitle?.runs || [];

        // subRuns: [artist, " • ", "album" or "year", " • ", duration]
        const artist   = subRuns[0]?.text || 'Unknown';
        const album    = subRuns[2]?.text || '';
        const durStr   = subRuns[subRuns.length - 1]?.text || '0:00';
        const thumb    = parseThumbnail(
          r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [],
        );

        tracks.push({
          id:       videoId,
          title,
          artist,
          album,
          thumbnail: thumb,
          albumArt:  thumb,
          duration:  parseDurationSecs(durStr),
          source:   'youtubeMusic',
        });
      }
    }
    return tracks;
  } catch (err) {
    console.error('YTM search error:', err);
    throw new Error('YouTube Music search failed. Please try again.');
  }
}

// ── Get home / charts ──────────────────────────────────────

export async function getYouTubeMusicCharts() {
  try {
    const data = await ytmFetch('browse', { browseId: 'FEmusic_charts' });
    const items = [];
    const sections =
      data?.contents?.singleColumnBrowseResultsRenderer
           ?.tabs?.[0]?.tabRenderer?.content
           ?.sectionListRenderer?.contents || [];

    for (const section of sections) {
      const shelf = section?.musicShelfRenderer || section?.musicCarouselShelfRenderer;
      const shelfItems = shelf?.contents || [];
      for (const item of shelfItems) {
        const r = item?.musicResponsiveListItemRenderer ||
                  item?.musicTwoRowItemRenderer;
        if (!r) continue;
        const videoId =
          r.playlistItemData?.videoId ||
          r.navigationEndpoint?.watchEndpoint?.videoId;
        if (!videoId) continue;
        const cols  = r.flexColumns || [];
        const title = parseRuns(cols[0]?.musicResponsiveListItemFlexColumnRenderer?.text)
                   || parseRuns(r.title);
        const thumb = parseThumbnail(
          r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [],
        );
        items.push({
          id:        videoId,
          title,
          artist:    parseRuns(cols[1]?.musicResponsiveListItemFlexColumnRenderer?.text)
                  || parseRuns(r.subtitle),
          thumbnail: thumb,
          albumArt:  thumb,
          source:    'youtubeMusic',
        });
        if (items.length >= 20) return items;
      }
    }
    return items;
  } catch (err) {
    console.error('YTM charts error:', err);
    return [];
  }
}

// ── Get best audio download URL for a YTM track ───────────

export async function getYTMDownloadInfo(videoId) {
  // Reuse the YouTube InnerTube player with ANDROID client
  const info = await getVideoInfo(videoId);
  const bestAudio = getBestAudioStream(info.audioStreams);
  if (!bestAudio) throw new Error('No audio stream found.');
  return {
    ...info,
    downloadStream: bestAudio,
  };
}
