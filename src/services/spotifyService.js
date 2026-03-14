// ============================================================
//  Spotify Service
//  Metadata: Spotify Web API
//  Download: Search YouTube → cobalt.tools (via streamResolver)
// ============================================================

import { searchYouTube } from './youtubeService';
import { resolveAudioUrl } from './streamResolver';

const SPOTIFY_API  = 'https://api.spotify.com/v1';
const SPOTIFY_AUTH = 'https://accounts.spotify.com/api/token';

let _cfg = { clientId: '', clientSecret: '', token: '', expiry: 0 };

export function setSpotifyCredentials(id, secret) {
  _cfg = { clientId: id, clientSecret: secret, token: '', expiry: 0 };
}

export function hasCredentials() {
  return !!(_cfg.clientId && _cfg.clientSecret);
}

async function getToken() {
  if (_cfg.token && Date.now() < _cfg.expiry) return _cfg.token;
  if (!hasCredentials()) throw new Error('No Spotify credentials. Add them in Settings.');
  const res = await fetch(SPOTIFY_AUTH, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${btoa(`${_cfg.clientId}:${_cfg.clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Spotify auth failed — check your Client ID & Secret.');
  const j   = await res.json();
  _cfg.token = j.access_token;
  _cfg.expiry = Date.now() + (j.expires_in - 60) * 1000;
  return _cfg.token;
}

async function spotGet(path) {
  const token = await getToken();
  const res   = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API ${res.status}`);
  return res.json();
}

function mapTrack(t) {
  if (!t) return null;
  return {
    id:          t.id,
    title:       t.name,
    artist:      t.artists?.map((a) => a.name).join(', ') || 'Unknown',
    album:       t.album?.name     || 'Unknown',
    albumArt:    t.album?.images?.[0]?.url || '',
    albumArtSm:  t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || '',
    duration:    Math.floor((t.duration_ms || 0) / 1000),
    previewUrl:  t.preview_url     || '',
    explicit:    t.explicit        || false,
    releaseDate: t.album?.release_date || '',
    isrc:        t.external_ids?.isrc  || '',
  };
}

export async function searchSpotifyTracks(query, limit = 20) {
  const data = await spotGet(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
  return (data.tracks?.items || []).map(mapTrack).filter(Boolean);
}

export async function getSpotifyTrack(id) {
  return mapTrack(await spotGet(`/tracks/${id}`));
}

// ── Find YouTube match + resolve download URL ─────────────
//
// Priority order:
//  1. ISRC search (most precise)
//  2. "title artist official audio"
//  3. "title artist"
// Picks the result closest in duration to the Spotify track.

export async function findAndResolveDownload(track) {
  const queries = [];
  if (track.isrc)      queries.push(track.isrc);
  queries.push(`${track.title} ${track.artist} official audio`);
  queries.push(`${track.title} ${track.artist}`);

  for (const q of queries) {
    try {
      const results = await searchYouTube(q);
      if (!results.length) continue;

      // Best match = closest duration (within 15 s) or first result
      const match =
        results.find((r) => r.duration > 0 && Math.abs(r.duration - track.duration) <= 15)
        || results[0];

      if (!match?.id) continue;

      // Use cobalt.tools to resolve the actual MP3 download URL
      const resolved = await resolveAudioUrl(match.id, '320');

      return {
        videoId:    match.id,
        matchTitle: match.title,
        url:        resolved.url,
        filename:   resolved.filename,
        quality:    '320 kbps MP3',
      };
    } catch (e) {
      console.warn('Spotify source attempt failed:', q, e.message);
    }
  }

  throw new Error('Could not find a download source. Try again or check your connection.');
}
