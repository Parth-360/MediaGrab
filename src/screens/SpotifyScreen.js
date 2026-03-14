import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS }   from '../theme/colors';
import SearchBar        from '../components/SearchBar';
import TrackCard        from '../components/TrackCard';
import VideoDetailSheet from '../components/VideoDetailSheet';
import {
  searchSpotifyTracks, findAndResolveDownload, hasCredentials,
} from '../services/spotifyService';
import { startDownload }    from '../services/downloadService';
import { useSearchHistory } from '../store/downloadStore';

export default function SpotifyScreen({ navigation }) {
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [query,         setQuery]         = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showSheet,     setShowSheet]     = useState(false);
  const [sheetLoading,  setSheetLoading]  = useState(false);
  const { addToHistory } = useSearchHistory();

  const handleSearch = useCallback(async (q) => {
    if (!hasCredentials()) {
      Alert.alert(
        '⚙️ Spotify Setup Required',
        '1. Go to developer.spotify.com\n2. Create a free app\n3. Copy Client ID & Secret\n4. Paste in Settings',
        [
          { text: 'Open Settings', onPress: () => navigation.navigate('Settings') },
          { text: 'Cancel' },
        ],
      );
      return;
    }
    setQuery(q);
    setLoading(true);
    try {
      const found = await searchSpotifyTracks(q);
      if (found.length === 0) {
        Alert.alert('No Results', `Nothing found for "${q}". Try different keywords.`);
      }
      setResults(found);
      addToHistory(q, 'spotify');
    } catch (e) {
      Alert.alert('Search Error', e.message);
    }
    setLoading(false);
  }, [addToHistory, navigation]);

  // Tap a track card → open the preview sheet
  const handleTrackTap = (track) => {
    setSelectedTrack(track);
    setSheetLoading(false);
    setShowSheet(true);
  };

  const closeSheet = () => {
    if (!sheetLoading) setShowSheet(false);
  };

  // Called when user taps "Download MP3" in the sheet
  const handleDownload = async (quality) => {
    if (!selectedTrack) return;
    setSheetLoading(true);

    try {
      // findAndResolveDownload searches YouTube for the track,
      // then calls resolveAudioUrl (loader.to) to get the MP3 link
      const source = await findAndResolveDownload(selectedTrack);

      await startDownload({
        title:     selectedTrack.title,
        url:       source.url,
        type:      'audio',
        quality:   quality?.label || '320 kbps MP3',
        source:    'spotify',
        thumbnail: selectedTrack.albumArt,
        artist:    selectedTrack.artist,
        album:     selectedTrack.album,
      });

      setShowSheet(false);
      Alert.alert(
        '✅ Download Started!',
        `"${selectedTrack.title}" by ${selectedTrack.artist}\n320 kbps MP3`,
        [
          { text: 'My Downloads', onPress: () => navigation.navigate('Downloads') },
          { text: 'OK' },
        ],
      );
    } catch (e) {
      setSheetLoading(false);
      Alert.alert(
        'Download Failed',
        e.message + '\n\nTip: Try a different search or check your connection.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackCard
            track={item}
            onPress={handleTrackTap}
            onDownload={handleTrackTap}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={styles.titleRow}>
                <Ionicons name="musical-notes" size={24} color={COLORS.primary} />
                <Text style={styles.headerTitle}>Spotify</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            <SearchBar
              placeholder="Search songs, artists, albums…"
              onSearch={handleSearch}
              onClear={() => setResults([])}
            />

            {!hasCredentials() && (
              <TouchableOpacity style={styles.banner} onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="key-outline" size={20} color={COLORS.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerTitle}>Setup Required</Text>
                  <Text style={styles.bannerDesc}>Tap here to add your free Spotify API credentials</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}

            <Text style={styles.hint}>
              💡 Tap any track to preview and download as a high-quality MP3
            </Text>

            {query.length > 0 && (
              <Text style={styles.sectionLabel}>
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Search Spotify</Text>
              <Text style={styles.emptyText}>
                {hasCredentials()
                  ? 'Search for any song, artist or album'
                  : 'Add Spotify credentials in Settings first'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.overlayText}>Searching Spotify…</Text>
        </View>
      )}

      {/* Preview sheet — audio-only mode (no video tabs) */}
      <VideoDetailSheet
        visible={showSheet}
        onClose={closeSheet}
        onDownload={handleDownload}
        media={selectedTrack}
        showVideoOptions={false}
        loading={sheetLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  titleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  banner:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warning + '15', margin: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.warning + '30', gap: 12 },
  bannerTitle:  { color: COLORS.warning, fontSize: 14, fontWeight: '700' },
  bannerDesc:   { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  hint:         { color: COLORS.textMuted, fontSize: 12, paddingHorizontal: 20, paddingBottom: 4, fontStyle: 'italic' },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', paddingHorizontal: 20, paddingVertical: 8 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle:   { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  emptyText:    { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayText:  { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
});
