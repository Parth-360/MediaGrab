// ============================================================
//  YouTube Service — uses YouTube InnerTube API (same API
//  that the official YouTube Android app uses internally).
//  This returns REAL, direct stream URLs that are downloadable.
// ============================================================

const INNERTUBE_BASE = 'https://www.youtube.com/youtubei/v1';
const INNERTUBE_KEY  = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

// ANDROID client → returns direct (unsigned) stream URLs
const ANDROID_CONTEXT = {
  client: {
    clientName:        'ANDROID',
    clientVersion:     '19.09.37',
    androidSdkVersion: 30,
    userAgent:         'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
    hl: 'en',
    gl: 'US',
    timeZone: 'UTC',
    utcOffsetMinutes: 0,
  },
};

// WEB client — used for search (richer result data)
const WEB_CONTEXT = {
  client: {
    clientName:    'WEB',
    clientVersion: '2.20240304.00.00',
    hl: 'en',
    gl: 'US',
  },
};

async function innerTube(endpoint, body, useAndroid = false) {
  const ctx = useAndroid ? ANDROID_CONTEXT : WEB_CONTEXT;
  const res = await fetch(`${INNERTUBE_BASE}/${endpoint}?key=${INNERTUBE_KEY}`, {
    method:  'POST',
    headers: {
      'Content-Type':             'application/json',
      'User-Agent':               useAndroid
        ? ANDROID_CONTEXT.client.userAgent
        : 'Mozilla/5.0',
      'X-YouTube-Client-Name':    useAndroid ? '3' : '1',
      'X-YouTube-Client-Version': ctx.client.clientVersion,
      'Origin':                   'https://www.youtube.com',
    },
    body: JSON.stringify({ context: ctx, ...body }),
  });
  if (!res.ok) throw new Error(`InnerTube ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ── helpers ────────────────────────────────────────────────

function parseThumbnail(thumbnails = []) {
  return [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || '';
}

function parseRuns(obj) {
  return obj?.runs?.map((r) => r.text).join('') || obj?.simpleText || '';
}

function parseDurationSecs(str = '') {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function parseViewCount(str = '') {
  return parseInt(str.replace(/\D/g, ''), 10) || 0;
}

function getBitrateLabel(bps = 0) {
  const kbps = Math.round(bps / 1000);
  if (kbps >= 256) return `~${kbps} kbps (High)`;
  if (kbps >= 128) return `~${kbps} kbps (Medium)`;
  return `~${kbps} kbps`;
}

// ── Search ─────────────────────────────────────────────────

export async function searchYouTube(query) {
  try {
    const data = await innerTube('search', { query });

    const items = [];
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer
          ?.primaryContents?.sectionListRenderer?.contents || [];

    for (const section of contents) {
      const videoList = section?.itemSectionRenderer?.contents || [];
      for (const item of videoList) {
        const v = item?.videoRenderer;
        if (!v?.videoId) continue;
        items.push({
          id:           v.videoId,
          title:        parseRuns(v.title),
          thumbnail:    parseThumbnail(v.thumbnail?.thumbnails),
          duration:     parseDurationSecs(parseRuns(v.lengthText)),
          views:        parseViewCount(parseRuns(v.viewCountText)),
          uploaderName: parseRuns(v.ownerText),
          uploadedDate: parseRuns(v.publishedTimeText),
          type:         'video',
        });
      }
    }
    return items.filter((i) => i.id);
  } catch (err) {
    console.error('YouTube search error:', err);
    throw new Error('Search failed. Please check your connection and try again.');
  }
}

// ── Video Info + Real Stream URLs ──────────────────────────

export async function getVideoInfo(videoId) {
  try {
    const data = await innerTube(
      'player',
      {
        videoId,
        params: '2AMBukAIIhAIGBgyEAIaAggD',
        playbackContext: {
          contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' },
        },
      },
      true, // use ANDROID context for direct stream URLs
    );

    const details   = data.videoDetails   || {};
    const streaming = data.streamingData  || {};

    // ── Audio-only adaptive streams ─────────────────────────
    const audioStreams = (streaming.adaptiveFormats || [])
      .filter((f) => f.url && f.mimeType?.startsWith('audio/'))
      .map((f) => ({
        url:           f.url,
        itag:          f.itag,
        mimeType:      f.mimeType,
        bitrate:       f.bitrate       || 0,
        averageBitrate: f.averageBitrate || f.bitrate || 0,
        audioQuality:  f.audioQuality  || '',
        contentLength: parseInt(f.contentLength || '0', 10),
        qualityLabel:  getBitrateLabel(f.averageBitrate || f.bitrate),
        type:          'audio',
        format:        f.mimeType?.includes('opus') ? 'OPUS' : 'M4A',
      }))
      .sort((a, b) => b.bitrate - a.bitrate); // highest first

    // ── Combined video+audio streams (easiest to download) ──
    const videoStreams = (streaming.formats || [])
      .filter((f) => f.url && f.mimeType?.startsWith('video/'))
      .map((f) => ({
        url:          f.url,
        itag:         f.itag,
        mimeType:     f.mimeType,
        quality:      f.quality,
        qualityLabel: f.qualityLabel || f.quality,
        width:        f.width  || 0,
        height:       f.height || 0,
        bitrate:      f.bitrate || 0,
        contentLength: parseInt(f.contentLength || '0', 10),
        type:         'video',
        combined:     true,  // has both video + audio
      }))
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    return {
      id:           videoId,
      title:        details.title            || 'Unknown',
      description:  details.shortDescription || '',
      thumbnail:    parseThumbnail(details.thumbnail?.thumbnails),
      duration:     parseInt(details.lengthSeconds || '0', 10),
      views:        parseInt(details.viewCount     || '0', 10),
      uploaderName: details.author                 || 'Unknown',
      isLive:       details.isLiveContent          || false,
      audioStreams,   // sorted: highest bitrate first
      videoStreams,   // sorted: highest resolution first
    };
  } catch (err) {
    console.error('getVideoInfo error:', err);
    throw new Error('Could not get video streams. Please try again.');
  }
}

// ── Stream selectors ───────────────────────────────────────

export function getBestAudioStream(streams = []) {
  return streams[0] || null;  // already sorted by bitrate desc
}

export function getVideoStreamByHeight(streams = [], height = 1080) {
  return (
    streams.find((s) => s.height === height) ||
    streams.find((s) => s.height <= height)  ||
    streams[streams.length - 1]              ||
    null
  );
}

// ── Trending ───────────────────────────────────────────────

export async function getTrending() {
  try {
    const data = await innerTube('browse', { browseId: 'FEtrending' });
    const items = [];
    const tabs  = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

    for (const tab of tabs) {
      const sections =
        tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
      for (const section of sections) {
        const videos =
          section?.itemSectionRenderer?.contents ||
          section?.shelfRenderer?.content?.expandedShelfContentsRenderer?.items || [];
        for (const item of videos) {
          const v =
            item?.videoRenderer ||
            item?.richItemRenderer?.content?.videoRenderer;
          if (!v?.videoId) continue;
          items.push({
            id:           v.videoId,
            title:        parseRuns(v.title),
            thumbnail:    parseThumbnail(v.thumbnail?.thumbnails),
            duration:     parseDurationSecs(parseRuns(v.lengthText)),
            views:        parseViewCount(parseRuns(v.viewCountText)),
            uploaderName: parseRuns(v.ownerText),
            uploadedDate: parseRuns(v.publishedTimeText),
            type:         'video',
          });
          if (items.length >= 20) return items;
        }
      }
    }
    return items;
  } catch (err) {
    console.error('Trending error:', err);
    return [];
  }
}
