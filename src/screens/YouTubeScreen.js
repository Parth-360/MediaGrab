import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import SearchBar    from '../components/SearchBar';
import VideoCard    from '../components/VideoCard';
import QualityModal from '../components/QualityModal';
import {
  searchYouTube, getVideoInfo, getTrending,
  getBestAudioStream, getVideoStreamByHeight,
} from '../services/youtubeService';
import { startDownload }    from '../services/downloadService';
import { useSearchHistory } from '../store/downloadStore';
import { extractVideoId }   from '../utils/helpers';

export default function YouTubeScreen({ navigation }) {
  const [results,     setResults]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [query,       setQuery]       = useState('');
  const [videoInfo,   setVideoInfo]   = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const { addToHistory } = useSearchHistory();

  useEffect(() => { loadTrending(); }, []);

  const loadTrending = async () => {
    setLoading(true);
    try { setResults(await getTrending()); } catch (_) {}
    setLoading(false);
  };

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    setLoading(true);
    try {
      const vid = extractVideoId(q);
      if (vid) {
        const info = await getVideoInfo(vid);
        setResults([{
          id: vid, title: info.title, thumbnail: info.thumbnail,
          duration: info.duration, views: info.views, uploaderName: info.uploaderName,
        }]);
      } else {
        setResults(await searchYouTube(q));
        addToHistory(q, 'youtube');
      }
    } catch (e) { Alert.alert('Search Error', e.message); }
    setLoading(false);
  }, [addToHistory]);

  const openQualityPicker = async (video) => {
    setInfoLoading(true);
    try {
      const info = await getVideoInfo(video.id);
      setVideoInfo(info);
      setShowModal(true);
    } catch (e) { Alert.alert('Error', e.message); }
    setInfoLoading(false);
  };

  const handleQualitySelect = async (quality) => {
    setShowModal(false);
    if (!videoInfo) return;
    let streamUrl = null;

    if (quality.type === 'audio') {
      const stream = getBestAudioStream(videoInfo.audioStreams);
      if (!stream?.url) { Alert.alert('Error', 'No audio stream available.'); return; }
      streamUrl = stream.url;
    } else {
      const height = parseInt(quality.value, 10);
      const stream = getVideoStreamByHeight(videoInfo.videoStreams, height);
      if (!stream?.url) { Alert.alert('Error', 'No video stream at this quality.'); return; }
      streamUrl = stream.url;
    }

    try {
      await startDownload({
        title: videoInfo.title, url: streamUrl, type: quality.type,
        quality: quality.label, source: 'youtube', thumbnail: videoInfo.thumbnail,
      });
      Alert.alert('✅ Download Started', `"${videoInfo.title}" — ${quality.label}`, [
        { text: 'View Downloads', onPress: () => navigation.navigate('Downloads') },
        { text: 'OK' },
      ]);
    } catch (e) { Alert.alert('Download Error', e.message); }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoCard video={item} onPress={openQualityPicker} onDownload={openQualityPicker} />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={styles.titleRow}>
                <Ionicons name="logo-youtube" size={26} color="#FF0000" />
                <Text style={styles.headerTitle}>YouTube</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
            <SearchBar
              placeholder="Search or paste YouTube URL…"
              onSearch={handleSearch}
              onClear={() => { setQuery(''); loadTrending(); }}
            />
            <Text style={styles.sectionLabel}>
              {query ? `${results.length} results for "${query}"` : 'Trending Now 🔥'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Search YouTube or paste a video link</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {(loading || infoLoading) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.overlayText}>
            {infoLoading ? 'Loading streams…' : 'Searching…'}
          </Text>
        </View>
      )}

      <QualityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleQualitySelect}
        title={videoInfo?.title}
        showVideoOptions={true}
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
  sectionLabel: { color: COLORS.textSecondary, fontSize: 13, paddingHorizontal: 20, paddingVertical: 8 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText:    { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', gap: 12 },
  overlayText:  { color: COLORS.textPrimary, fontSize: 14 },
});
