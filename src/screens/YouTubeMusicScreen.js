import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import SearchBar from '../components/SearchBar';
import { searchYouTubeMusic, getYouTubeMusicCharts } from '../services/youtubeMusicService';
import { resolveYTMusicUrl } from '../services/streamResolver';
import { startDownload }    from '../services/downloadService';
import { useSearchHistory } from '../store/downloadStore';
import { formatDuration }   from '../utils/helpers';

export default function YouTubeMusicScreen({ navigation }) {
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [query,    setQuery]    = useState('');
  const [dlId,     setDlId]     = useState(null);
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

  const handleDownload = async (track) => {
    setDlId(track.id);
    try {
      const resolved = await resolveYTMusicUrl(track.id);
      if (!resolved?.url) throw new Error('Could not get download link.');

      await startDownload({
        title:     track.title,
        url:       resolved.url,
        type:      'audio',
        quality:   '320 kbps MP3',
        source:    'youtubeMusic',
        thumbnail: track.albumArt || track.thumbnail,
        artist:    track.artist,
        album:     track.album || '',
      });

      Alert.alert(
        '✅ Download Started!',
        `"${track.title}" by ${track.artist}\n320 kbps MP3`,
        [
          { text: 'My Downloads', onPress: () => navigation.navigate('Downloads') },
          { text: 'OK' },
        ],
      );
    } catch (e) {
      Alert.alert('Download Failed', e.message);
    }
    setDlId(null);
  };

  const renderTrack = ({ item }) => (
    <TouchableOpacity
      style={styles.trackCard}
      onPress={() => handleDownload(item)}
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
      {dlId === item.id ? (
        <View style={styles.dlBtn}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <TouchableOpacity style={styles.dlBtn} onPress={() => handleDownload(item)}>
          <Ionicons name="download-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      )}
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
                <Text style={styles.heroSub}>Download any song — 320 kbps MP3</Text>
              </View>
            </LinearGradient>

            <SearchBar
              placeholder="Search songs, artists, albums…"
              onSearch={handleSearch}
              onClear={() => { setQuery(''); loadCharts(); }}
            />

            <Text style={styles.hint}>
              💡 Tap any track or the download icon to save it
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
  dlBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle:   { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  emptyText:    { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayText:  { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
});
