import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDownloadListener, getDownloadsList } from '../services/downloadService';

const SETTINGS_KEY = '@MediaGrab:settings';
const HISTORY_KEY = '@MediaGrab:history';

const defaultSettings = {
  defaultVideoQuality: '1080',
  defaultAudioQuality: '320',
  saveToGallery: true,
  darkMode: true,
  spotifyClientId: '',
  spotifyClientSecret: '',
  downloadPath: 'MediaGrab',
  maxConcurrentDownloads: 3,
  notifications: true,
};

export function useDownloads() {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    setDownloads(getDownloadsList());
    const unsubscribe = addDownloadListener(setDownloads);
    return unsubscribe;
  }, []);

  return downloads;
}

export function useSettings() {
  const [settings, setSettingsState] = useState(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettingsState({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.log('Failed to load settings:', e);
    }
    setLoaded(true);
  };

  const updateSettings = useCallback(async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save settings:', e);
    }
  }, [settings]);

  return { settings, updateSettings, loaded };
}

export function useSearchHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.log('Failed to load history:', e);
    }
  };

  const addToHistory = useCallback(async (query, source) => {
    const entry = { query, source, timestamp: Date.now() };
    const updated = [entry, ...history.filter((h) => h.query !== query)].slice(0, 50);
    setHistory(updated);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Failed to save history:', e);
    }
  }, [history]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.log('Failed to clear history:', e);
    }
  }, []);

  return { history, addToHistory, clearHistory };
}
