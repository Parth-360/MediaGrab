import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import SearchBar from '../components/SearchBar';
import {
  searchYouTubeMusic, getYouTubeMusicCharts, getYTMDownloadInfo,
} from '../services/youtubeMusicService';
import { startDownload }    from '../services/downloadService';
import { useSearchHistory } from '../store/downloadStore';
import { formatDuration }   from '../utils/helpers';

export default function YouTubeMusicScreen({ navigation }) {
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [query,      setQuery]      = useState('');
  const [dlId,       setDlId]       = useState(null);
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
      setResults(await searchYouTubeMusic(q));
      addToHistory(q, 'youtubeMusic');
    } catch (e) { Alert.alert('Search Error', e.message); }
    setLoading(false);
  }, [addToHistory]);

  const handleDownload = async (track) => {
    setDlId(track.id);
    try {
      const info = await getYTMDownloadInfo(track.id);
      await startDownload({
        title:     track.title,
        url:       info.downloadStream.url,
        type:      'audio',
        quality:   info.downloadStream.qualityLabel || 'Best quality',
        source:    'youtubeMusic',
        thumbnail: track.albumArt || track.thumbnail,
        artist:    track.artist,
        album:     track.album || '',
      });
      Alert.alert(
        '✅ Download Started',
        `"${track.title}" — ${info.downloadStream.qualityLabel}`,
        [
          { text: 'View Downloads', onPress: () => navigation.navigate('Downloads') },
          { text: 'OK' },
        ],
      );
    } catch (e) { Alert.alert('Download Error', e.message); }
    setDlId(null);
  };

  const renderTrack = ({ item }) => (
    <View style={styles.trackCard}>
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
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <TouchableOpacity style={styles.dlBtn} onPress={() => handleDownload(item)}>
          <Ionicons name="download-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderTrack}
        ListHeaderComponent={
          <View>
            {/* Header banner */}
            <LinearGradient
              colors={['#FF0000', '#CC0000', COLORS.background]}
              style={styles.heroBanner}
            >
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.heroText}>
                <Ionicons name="musical-note" size={32} color="#FFF" />
                <Text style={styles.heroTitle}>YouTube Music</Text>
                <Text style={styles.heroSub}>Download in highest quality audio</Text>
              </View>
            </LinearGradient>

            <SearchBar
              placeholder="Search songs, artists, albums…"
              onSearch={handleSearch}
              onClear={() => { setQuery(''); loadCharts(); }}
            />
            <Text style={styles.sectionLabel}>
              {query ? `${results.length} results for "${query}"` : '🔥 Top Charts'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Search YouTube Music</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#FF0000" />
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
  heroBanner:   { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20 },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroText:     { alignItems: 'center', gap: 6 },
  heroTitle:    { color: '#FFF', fontSize: 26, fontWeight: '800' },
  heroSub:      { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, paddingHorizontal: 20, paddingVertical: 8 },
  trackCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 16, marginVertical: 4, borderRadius: 10, padding: 10 },
  albumArt:     { width: 54, height: 54, borderRadius: 6, backgroundColor: COLORS.surfaceLight },
  trackInfo:    { flex: 1, marginLeft: 12, marginRight: 8 },
  trackTitle:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  trackArtist:  { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  trackDuration:{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  dlBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText:    { color: COLORS.textMuted, fontSize: 16 },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', gap: 12 },
  overlayText:  { color: COLORS.textPrimary, fontSize: 14 },
});
