import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import SearchBar    from '../components/SearchBar';
import TrackCard    from '../components/TrackCard';
import QualityModal from '../components/QualityModal';
import {
  searchSpotifyTracks, findDownloadSource, hasCredentials,
} from '../services/spotifyService';
import { startDownload }    from '../services/downloadService';
import { useSearchHistory } from '../store/downloadStore';

export default function SpotifyScreen({ navigation }) {
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [query,        setQuery]        = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [sourcingId,   setSourcingId]   = useState(null);
  const { addToHistory } = useSearchHistory();

  const handleSearch = useCallback(async (q) => {
    if (!hasCredentials()) {
      Alert.alert(
        '⚙️ Spotify Setup Required',
        'Add your free Spotify API credentials in Settings.\n\n1. Visit developer.spotify.com\n2. Create an app (free)\n3. Copy Client ID & Secret\n4. Paste in Settings',
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
      setResults(await searchSpotifyTracks(q));
      addToHistory(q, 'spotify');
    } catch (e) { Alert.alert('Search Error', e.message); }
    setLoading(false);
  }, [addToHistory, navigation]);

  const handleDownloadPress = (track) => {
    setSelectedTrack(track);
    setShowModal(true);
  };

  const handleQualitySelect = async (quality) => {
    setShowModal(false);
    if (!selectedTrack) return;

    setSourcingId(selectedTrack.id);
    try {
      const source = await findDownloadSource(selectedTrack);
      await startDownload({
        title:     selectedTrack.title,
        url:       source.streamUrl,
        type:      'audio',
        quality:   `${quality.label} (via YouTube)`,
        source:    'spotify',
        thumbnail: selectedTrack.albumArt,
        artist:    selectedTrack.artist,
        album:     selectedTrack.album,
      });
      Alert.alert(
        '✅ Download Started',
        `"${selectedTrack.title}" by ${selectedTrack.artist}`,
        [
          { text: 'View Downloads', onPress: () => navigation.navigate('Downloads') },
          { text: 'OK' },
        ],
      );
    } catch (e) { Alert.alert('Download Error', e.message); }
    setSourcingId(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <TrackCard track={item} onPress={handleDownloadPress} onDownload={handleDownloadPress} />
            {sourcingId === item.id && (
              <View style={styles.sourcing}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.sourcingText}>Finding best audio source…</Text>
              </View>
            )}
          </View>
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
                  <Text style={styles.bannerDesc}>Tap to add Spotify API credentials in Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}

            {query.length > 0 && (
              <Text style={styles.sectionLabel}>{results.length} results for "{query}"</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                {hasCredentials()
                  ? 'Search for songs, artists or albums'
                  : 'Configure Spotify in Settings to start downloading'}
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

      <QualityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleQualitySelect}
        title={selectedTrack?.title}
        showVideoOptions={false}
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
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, paddingHorizontal: 20, paddingVertical: 8 },
  sourcing:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 8 },
  sourcingText: { color: COLORS.textSecondary, fontSize: 12 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText:    { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', gap: 12 },
  overlayText:  { color: COLORS.textPrimary, fontSize: 14 },
});
