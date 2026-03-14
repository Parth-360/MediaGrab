import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS }         from '../theme/colors';
import SearchBar        from '../components/SearchBar';
import VideoDetailSheet from '../components/VideoDetailSheet';
import { searchYouTubeMusic, getYouTubeMusicCharts } from '../services/youtubeMusicService';
import { resolveYTMusicUrl } from '../services/streamResolver';
import { startDownload }     from '../services/downloadService';
import { useSearchHistory }  from '../store/downloadStore';
import { formatDuration }    from '../utils/helpers';

export default function YouTubeMusicScreen({ navigation }) {
  const [results,       setResults]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [query,         setQuery]         = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showSheet,     setShowSheet]     = useState(false);
  const [sheetLoading,  setSheetLoading]  = useState(false);
  const { addToHistory } = useSearchHistory();

  useEffect(() => { loadCharts(); }, []);

  const loadCharts = async () => {
    setLoading(true);
    try { setResults(await getYouTubeMusicCharts()); } catch (_) {}
    setLoading(false);
  };

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    setLoading(true);
    try {
      const found = await searchYouTubeMusic(q);
      if (found.length === 0) {
        Alert.alert('No Results', `Nothing found for "${q}". Try different keywords.`);
      }
      setResults(found);
      addToHistory(q, 'youtubeMusic');
    } catch (e) {
      Alert.alert('Search Error', e.message);
    }
    setLoading(false);
  }, [addToHistory]);

  // Tap a track → open preview sheet
  const handleTrackTap = (track) => {
    setSelectedTrack(track);
    setSheetLoading(false);
    setShowSheet(true);
  };

  const closeSheet = () => {
    if (!sheetLoading) setShowSheet(false);
  };

  // Called from the sheet's "Download MP3" button
  const handleDownload = async (quality) => {
    if (!selectedTrack) return;
    setSheetLoading(true);

    try {
      const resolved = await resolveYTMusicUrl(selectedTrack.id);
      if (!resolved?.url) throw new Error('Could not get download link. Please try again.');

      await startDownload({
        title:     selectedTrack.title,
        url:       resolved.url,
        type:      'audio',
        quality:   quality?.label || '320 kbps MP3',
        source:    'youtubeMusic',
        thumbnail: selectedTrack.albumArt || selectedTrack.thumbnail,
        artist:    selectedTrack.artist,
        album:     selectedTrack.album || '',
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
      Alert.alert('Download Failed', e.message);
    }
  };

  const renderTrack = ({ item }) => (
    <TouchableOpacity
      style={styles.trackCard}
      onPress={() => handleTrackTap(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.albumArt || item.thumbnail }}
        style={styles.albumArt}
        resizeMode="cover"
      />
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
        {item.duration > 0 && (
          <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
        )}
      </View>
      {/* Eye icon hints the card is tappable for a preview */}
      <View style={styles.previewBtn}>
        <Ionicons name="play-circle-outline" size={26} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderTrack}
        ListHeaderComponent={
          <View>
            <LinearGradient colors={['#B00000', '#660000', COLORS.background]} style={styles.hero}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.heroContent}>
                <Ionicons name="musical-note" size={36} color="#FFF" />
                <Text style={styles.heroTitle}>YouTube Music</Text>
                <Text style={styles.heroSub}>Download any song — high quality MP3</Text>
              </View>
            </LinearGradient>

            <SearchBar
              placeholder="Search songs, artists, albums…"
              onSearch={handleSearch}
              onClear={() => { setQuery(''); loadCharts(); }}
            />

            <Text style={styles.hint}>
              💡 Tap any track to preview and download it
            </Text>

            <Text style={styles.sectionLabel}>
              {query
                ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                : '🎵 Top Charts'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Search YouTube Music</Text>
              <Text style={styles.emptyText}>Find any song and download it instantly</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FF4444" />
          <Text style={styles.overlayText}>
            {query ? 'Searching…' : 'Loading charts…'}
          </Text>
        </View>
      )}

      {/* Preview + download sheet */}
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
  hero:         { paddingTop: 50, paddingBottom: 28, paddingHorizontal: 20 },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroContent:  { alignItems: 'center', gap: 6 },
  heroTitle:    { color: '#FFF', fontSize: 26, fontWeight: '800' },
  heroSub:      { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  hint:         { color: COLORS.textMuted, fontSize: 12, paddingHorizontal: 20, paddingTop: 4, fontStyle: 'italic' },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', paddingHorizontal: 20, paddingVertical: 10 },
  trackCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginVertical: 4, borderRadius: 10, padding: 10 },
  albumArt:     { width: 54, height: 54, borderRadius: 6, backgroundColor: COLORS.surfaceLight },
  trackInfo:    { flex: 1, marginLeft: 12, marginRight: 8 },
  trackTitle:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  trackArtist:  { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  trackDuration:{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  previewBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle:   { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  emptyText:    { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayText:  { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
});
