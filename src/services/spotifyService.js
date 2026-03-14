// ============================================================
//  Spotify Service
//  • Spotify Web API  → metadata (title, artist, album art)
//  • YouTube InnerTube → actual audio stream (best quality)
//  This is the same approach used by spotdl / spotify-dl tools.
// ============================================================

import { searchYouTube, getVideoInfo, getBestAudioStream } from './youtubeService';

const SPOTIFY_API  = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH = 'https://accounts.spotify.com/api/token';

let _config = {
  clientId:     '',
  clientSecret: '',
  accessToken:  '',
  tokenExpiry:  0,
};

export function setSpotifyCredentials(clientId, clientSecret) {
  _config.clientId     = clientId;
  _config.clientSecret = clientSecret;
  _config.accessToken  = '';   // force refresh on next call
  _config.tokenExpiry  = 0;
}

export function hasCredentials() {
  return !!(_config.clientId && _config.clientSecret);
}

// ── Auth ───────────────────────────────────────────────────

async function getToken() {
  if (_config.accessToken && Date.now() < _config.tokenExpiry) {
    return _config.accessToken;
  }
  if (!hasCredentials()) {
    throw new Error(
      'Spotify credentials not set.\nGo to Settings and add your Client ID & Secret.',
    );
  }
  const creds    = btoa(`${_config.clientId}:${_config.clientSecret}`);
  const response = await fetch(SPOTIFY_AUTH, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    throw new Error('Spotify auth failed. Check your Client ID and Secret in Settings.');
  }
  const json = await response.json();
  _config.accessToken = json.access_token;
  _config.tokenExpiry = Date.now() + (json.expires_in - 60) * 1000;
  return _config.accessToken;
}

async function spotGet(path) {
  const token    = await getToken();
  const response = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Spotify API error ${response.status}`);
  return response.json();
}

// ── Track helpers ──────────────────────────────────────────

function mapTrack(track) {
  return {
    id:          track.id,
    title:       track.name,
    artist:      track.artists?.map((a) => a.name).join(', ') || 'Unknown',
    album:       track.album?.name || 'Unknown',
    albumArt:    track.album?.images?.[0]?.url || '',
    albumArtSm:  track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || '',
    duration:    Math.floor((track.duration_ms || 0) / 1000),
    previewUrl:  track.preview_url || '',
    spotifyUrl:  track.external_urls?.spotify || '',
    popularity:  track.popularity || 0,
    explicit:    track.explicit   || false,
    releaseDate: track.album?.release_date || '',
    isrc:        track.external_ids?.isrc  || '',
  };
}

// ── Search ─────────────────────────────────────────────────

export async function searchSpotifyTracks(query, limit = 20) {
  try {
    const q    = encodeURIComponent(query);
    const data = await spotGet(`/search?q=${q}&type=track&limit=${limit}`);
    return (data.tracks?.items || []).map(mapTrack);
  } catch (err) {
    console.error('Spotify search error:', err);
    throw new Error(err.message || 'Spotify search failed.');
  }
}

export async function getSpotifyTrack(trackId) {
  const t = await spotGet(`/tracks/${trackId}`);
  return mapTrack(t);
}

export async function getSpotifyPlaylist(playlistId) {
  const data = await spotGet(`/playlists/${playlistId}`);
  return {
    id:          data.id,
    name:        data.name,
    description: data.description || '',
    image:       data.images?.[0]?.url || '',
    owner:       data.owner?.display_name || 'Unknown',
    totalTracks: data.tracks?.total || 0,
    tracks:      (data.tracks?.items || [])
      .filter((i) => i.track)
      .map((i) => mapTrack(i.track)),
  };
}

// ── Find real download source on YouTube ──────────────────
//
//  Strategy (in order of accuracy):
//  1. Search by ISRC tag   → most unique identifier
//  2. Search "title artist official audio"
//  3. Search "title artist lyrics"
//  Pick the first result whose duration is within 10 s of the track.

export async function findDownloadSource(track) {
  const queries = [];

  if (track.isrc) {
    queries.push(track.isrc);
  }
  queries.push(`${track.title} ${track.artist} official audio`);
  queries.push(`${track.title} ${track.artist} lyrics`);
  queries.push(`${track.title} ${track.artist}`);

  for (const q of queries) {
    try {
      const results = await searchYouTube(q);
      if (!results.length) continue;

      // Prefer a result whose duration matches the Spotify track (± 10 s)
      const match =
        results.find(
          (r) => track.duration > 0 && Math.abs(r.duration - track.duration) <= 10,
        ) || results[0];

      const info      = await getVideoInfo(match.id);
      const bestAudio = getBestAudioStream(info.audioStreams);

      if (!bestAudio?.url) continue;

      return {
        videoId:     match.id,
        matchTitle:  match.title,
        streamUrl:   bestAudio.url,
        bitrate:     bestAudio.bitrate,
        mimeType:    bestAudio.mimeType,
        format:      bestAudio.format || 'M4A',
        qualityLabel: bestAudio.qualityLabel,
        contentLength: bestAudio.contentLength,
        allStreams:  info.audioStreams,
      };
    } catch (e) {
      console.warn('findDownloadSource query failed:', q, e.message);
    }
  }

  throw new Error(
    'Could not find a download source for this track. Try again or search manually.',
  );
}
