// ============================================================
//  Download Service
//  Handles real file downloads using expo-file-system.
//  Supports pause / resume / cancel / retry.
//  Saves completed files to the device Media Library.
// ============================================================

import * as FileSystem  from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { DOWNLOAD_STATUS } from '../utils/constants';
import { sanitizeFilename, generateUniqueId } from '../utils/helpers';

const DOWNLOAD_DIR = FileSystem.documentDirectory + 'MediaGrab/';

// ── In-memory state ───────────────────────────────────────

const downloads = new Map();         // id → DownloadItem
const listeners = new Set();         // callbacks

function notify() {
  const list = getDownloadsList();
  listeners.forEach((cb) => cb(list));
}

// ── Public API ─────────────────────────────────────────────

export function addDownloadListener(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDownloadsList() {
  return Array.from(downloads.values())
    .sort((a, b) => b.startedAt - a.startedAt);
}

export function getDownload(id) {
  return downloads.get(id) || null;
}

// ── Start ──────────────────────────────────────────────────

export async function startDownload({
  title, url, type, quality, source, thumbnail, artist = '', album = '',
}) {
  if (!url) throw new Error('No download URL provided.');

  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }

  const id        = generateUniqueId();
  const extension = type === 'video' ? 'mp4' : 'mp3';
  const filename  = sanitizeFilename(`${title}.${extension}`);
  const filePath  = DOWNLOAD_DIR + filename;

  const item = {
    id, title, filename, filePath, url,
    type, quality, source, thumbnail, artist, album,
    status:        DOWNLOAD_STATUS.DOWNLOADING,
    progress:      0,
    totalSize:     0,
    downloadedSize: 0,
    startedAt:     Date.now(),
    completedAt:   null,
    error:         null,
    resumable:     null,
  };

  downloads.set(id, item);
  notify();

  _runDownload(id);
  return id;
}

async function _runDownload(id) {
  const item = downloads.get(id);
  if (!item) return;

  try {
    const progressCb = ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const i = downloads.get(id);
      if (!i) return;
      const progress = totalBytesExpectedToWrite > 0
        ? totalBytesWritten / totalBytesExpectedToWrite
        : 0;
      downloads.set(id, {
        ...i,
        progress,
        downloadedSize: totalBytesWritten,
        totalSize:      totalBytesExpectedToWrite,
      });
      notify();
    };

    const resumable = FileSystem.createDownloadResumable(
      item.url,
      item.filePath,
      {
        headers: {
          // Standard browser headers — compatible with loader.to CDN URLs
          'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G780G) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept':     '*/*',
        },
        sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      },
      progressCb,
    );

    // Store resumable so user can pause later
    downloads.set(id, { ...downloads.get(id), resumable });

    const result = await resumable.downloadAsync();

    if (result) {
      const completed = {
        ...downloads.get(id),
        status:      DOWNLOAD_STATUS.COMPLETED,
        progress:    1,
        completedAt: Date.now(),
        filePath:    result.uri,
        resumable:   null,
      };
      downloads.set(id, completed);
      notify();

      // Save to device gallery / media library
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(result.uri);
          // Put in a "MediaGrab" album
          const albums = await MediaLibrary.getAlbumsAsync();
          let album    = albums.find((a) => a.title === 'MediaGrab');
          if (!album) {
            album = await MediaLibrary.createAlbumAsync('MediaGrab', asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        }
      } catch (e) {
        console.log('Media library save error:', e);
      }
    }
  } catch (err) {
    const i = downloads.get(id);
    if (i) {
      downloads.set(id, {
        ...i,
        status:   DOWNLOAD_STATUS.FAILED,
        error:    err.message,
        resumable: null,
      });
      notify();
    }
  }
}

// ── Pause ─────────────────────────────────────────────────

export async function pauseDownload(id) {
  const item = downloads.get(id);
  if (!item?.resumable) return;
  try {
    await item.resumable.pauseAsync();
    downloads.set(id, { ...item, status: DOWNLOAD_STATUS.PAUSED });
    notify();
  } catch (e) {
    console.error('Pause error:', e);
  }
}

// ── Resume ─────────────────────────────────────────────────

export async function resumeDownload(id) {
  const item = downloads.get(id);
  if (!item?.resumable) return;
  downloads.set(id, { ...item, status: DOWNLOAD_STATUS.DOWNLOADING });
  notify();
  try {
    const result = await item.resumable.resumeAsync();
    if (result) {
      downloads.set(id, {
        ...downloads.get(id),
        status:      DOWNLOAD_STATUS.COMPLETED,
        progress:    1,
        completedAt: Date.now(),
        filePath:    result.uri,
      });
      notify();
    }
  } catch (e) {
    downloads.set(id, {
      ...downloads.get(id),
      status: DOWNLOAD_STATUS.FAILED,
      error:  e.message,
    });
    notify();
  }
}

// ── Cancel ─────────────────────────────────────────────────

export async function cancelDownload(id) {
  const item = downloads.get(id);
  if (!item) return;
  try {
    if (item.resumable) await item.resumable.pauseAsync();
    const info = await FileSystem.getInfoAsync(item.filePath);
    if (info.exists) await FileSystem.deleteAsync(item.filePath);
  } catch (_) {}
  downloads.set(id, { ...item, status: DOWNLOAD_STATUS.CANCELLED, resumable: null });
  notify();
}

// ── Delete ─────────────────────────────────────────────────

export async function deleteDownload(id) {
  const item = downloads.get(id);
  if (!item) return;
  try {
    const info = await FileSystem.getInfoAsync(item.filePath);
    if (info.exists) await FileSystem.deleteAsync(item.filePath);
  } catch (_) {}
  downloads.delete(id);
  notify();
}

// ── Retry ──────────────────────────────────────────────────

export async function retryDownload(id) {
  const item = downloads.get(id);
  if (!item) return;
  downloads.delete(id);
  return startDownload({
    title:     item.title,
    url:       item.url,
    type:      item.type,
    quality:   item.quality,
    source:    item.source,
    thumbnail: item.thumbnail,
    artist:    item.artist,
    album:     item.album,
  });
}

// ── Clear completed ────────────────────────────────────────

export async function clearCompletedDownloads() {
  const ids = [];
  downloads.forEach((item, id) => {
    if (
      item.status === DOWNLOAD_STATUS.COMPLETED ||
      item.status === DOWNLOAD_STATUS.CANCELLED
    ) ids.push(id);
  });
  for (const id of ids) await deleteDownload(id);
}

// ── Storage info ───────────────────────────────────────────

export async function getStorageInfo() {
  try {
    const free  = await FileSystem.getFreeDiskStorageAsync();
    const total = await FileSystem.getTotalDiskCapacityAsync();
    return { free, total, used: total - free };
  } catch {
    return { free: 0, total: 0, used: 0 };
  }
}
