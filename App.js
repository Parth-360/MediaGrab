import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { setSpotifyCredentials } from './src/services/spotifyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Suppress non-critical warnings in production
LogBox.ignoreLogs(['Warning:']);

export default function App() {
  useEffect(() => {
    // Load saved Spotify credentials on app start
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const stored = await AsyncStorage.getItem('@MediaGrab:settings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.spotifyClientId && settings.spotifyClientSecret) {
          setSpotifyCredentials(settings.spotifyClientId, settings.spotifyClientSecret);
        }
      }
    } catch (e) {
      console.log('Failed to load credentials:', e);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#121212" translucent={false} />
      <AppNavigator />
    </>
  );
}
