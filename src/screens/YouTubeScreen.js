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
import { searchYouTube, getTrending, getVideoMeta, extractVideoId } from '../services/youtubeService';
import { resolveAudioUrl, resolveVideoUrl } from '../services/streamResolver';
import { startDownload }    from '../services/downloadService';
import { useSearchHistory } from '../store/downloadStore';

export default function YouTubeScreen({ navigation }) {
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [query,        setQuery]        = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [resolving,    setResolving]    = useState(false);
  const { addToHistory } = useSearchHistory();

  useEffect(() => { loadTrending(); }, []);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const trending = await getTrending();
      setResults(trending);
    } catch (_) {}
    setLoading(false);
  };

  const handleSearch = useCallback(async (q) => {
    setQuery(q);
    setLoading(true);
    try {
      const vid = extractVideoId(q);
      if (vid) {
        // Direct URL pasted — get metadata and show
        const meta = await getVideoMeta(vid);
        setResults([meta]);
      } else {
        const found = await searchYouTube(q);
        if (found.length === 0) {
          Alert.alert('No Results', `Nothing found for "${q}". Try different keywords.`);
        }
        setResults(found);
        addToHistory(q, 'youtube');
      }
    } catch (e) {
      Alert.alert('Search Error', e.message);
    }
    setLoading(false);
  }, [addToHistory]);

  // Tap a result → show quality picker
  const handleVideoTap = (video) => {
    setSelectedVideo(video);
    setShowModal(true);
  };

  const handleQualitySelect = async (quality) => {
    setShowModal(false);
    if (!selectedVideo) return;

    setResolving(true);
    try {
      let resolved;

      if (quality.type === 'audio') {
        // Audio only — highest quality MP3
        resolved = await resolveAudioUrl(selectedVideo.id, '320');
      } else {
        // Video + audio combined
        resolved = await resolveVideoUrl(selectedVideo.id, quality.value);
      }

      if (!resolved?.url) throw new Error('Could not get download link.');

      await startDownload({
        title:     selectedVideo.title,
        url:       resolved.url,
        type:      quality.type,
        quality:   quality.label,
        source:    'youtube',
        thumbnail: selectedVideo.thumbnail,
      });

      Alert.alert(
        '✅ Download Started!',
        `"${selectedVideo.title}"\n${quality.label}`,
        [
          { text: 'My Downloads', onPress: () => navigation.navigate('Downloads') },
          { text: 'OK' },
        ],
      );
    } catch (e) {
      Alert.alert('Download Failed', e.message + '\n\nTip: Make sure you have a stable internet connection.');
    }
    setResolving(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={handleVideoTap}
            onDownload={handleVideoTap}
          />
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
              placeholder="Search or paste YouTube link…"
              onSearch={handleSearch}
              onClear={() => { setQuery(''); loadTrending(); }}
            />

            <Text style={styles.hint}>
              💡 Tap any video → choose Video (1080p/720p) or Audio (320kbps MP3)
            </Text>

            <Text style={styles.sectionLabel}>
              {query
                ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                : '🔥 Trending Now'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Search YouTube</Text>
              <Text style={styles.emptyText}>
                Search by name or paste a YouTube link to download
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading overlay */}
      {(loading || resolving) && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.overlayText}>
            {resolving ? '⏳ Getting download link…' : 'Searching YouTube…'}
          </Text>
          {resolving && (
            <Text style={styles.overlaySubText}>This takes a few seconds</Text>
          )}
        </View>
      )}

      <QualityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleQualitySelect}
        title={selectedVideo?.title}
        showVideoOptions={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  backBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  titleRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:    { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  hint:           { color: COLORS.textMuted, fontSize: 12, paddingHorizontal: 20, paddingTop: 4, fontStyle: 'italic' },
  sectionLabel:   { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', paddingHorizontal: 20, paddingVertical: 10 },
  empty:          { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTitle:     { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  emptyText:      { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', gap: 14 },
  overlayText:    { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  overlaySubText: { color: COLORS.textSecondary, fontSize: 13 },
});
