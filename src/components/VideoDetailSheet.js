// ============================================================
//  VideoDetailSheet
//  A bottom-sheet preview shown before a download starts.
//
//  Props:
//    visible          – boolean
//    onClose          – () => void
//    onDownload       – (quality: { label, value, type }) => void
//    media            – { title, thumbnail, albumArt, uploaderName,
//                         artist, album, duration, views }
//    showVideoOptions – true  → show Video / Audio MP3 tabs (YouTube)
//                       false → audio-only mode (Spotify / YT Music)
//    loading          – true while resolving download URL
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Image, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS }         from '../theme/colors';
import { formatDuration, formatNumber } from '../utils/helpers';

// ── Quality definitions ────────────────────────────────────

const VIDEO_OPTIONS = [
  { label: '1080p Full HD', value: '1080', type: 'video', icon: 'videocam-outline',      best: true  },
  { label: '720p HD',       value: '720',  type: 'video', icon: 'videocam-outline',      best: false },
  { label: '480p SD',       value: '480',  type: 'video', icon: 'videocam-outline',      best: false },
  { label: '360p',          value: '360',  type: 'video', icon: 'film-outline',          best: false },
];

// Single audio option — loader.to returns best available MP3
const AUDIO_DOWNLOAD = { label: '320 kbps MP3', value: '320', type: 'audio' };

// ── Sub-components ─────────────────────────────────────────

function MetaChip({ icon, text }) {
  if (!text) return null;
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={12} color={COLORS.textMuted} />
      <Text style={styles.metaText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function VideoQualityRow({ option, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.qualityRow, option.best && styles.qualityRowBest]}
      onPress={() => onPress(option)}
      activeOpacity={0.7}
    >
      <View style={styles.qualityLeft}>
        <View style={[styles.qualityIconWrap, option.best && styles.qualityIconWrapBest]}>
          <Ionicons
            name={option.icon}
            size={18}
            color={option.best ? COLORS.primary : COLORS.textSecondary}
          />
        </View>
        <View>
          <Text style={[styles.qualityLabel, option.best && styles.qualityLabelBest]}>
            {option.label}
          </Text>
          {option.best && <Text style={styles.bestTag}>⭐ Best Quality</Text>}
        </View>
      </View>

      <View style={[styles.dlBtn, option.best && styles.dlBtnBest]}>
        <Ionicons
          name="download-outline"
          size={15}
          color={option.best ? '#FFF' : COLORS.textSecondary}
        />
        <Text style={[styles.dlBtnTxt, option.best && styles.dlBtnTxtBest]}>Download</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main component ─────────────────────────────────────────

export default function VideoDetailSheet({
  visible,
  onClose,
  onDownload,
  media,
  showVideoOptions = true,
  loading = false,
}) {
  const [tab, setTab] = useState(showVideoOptions ? 'video' : 'audio');

  // Reset tab every time the sheet opens
  useEffect(() => {
    if (visible) setTab(showVideoOptions ? 'video' : 'audio');
  }, [visible, showVideoOptions]);

  if (!visible || !media) return null;

  const thumb    = media.thumbnail || media.albumArt || '';
  const title    = media.title     || 'Unknown';
  const artist   = media.artist    || media.uploaderName || '';
  const album    = media.album     || '';
  const duration = media.duration  || 0;
  const views    = media.views     || 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Tap outside to close (only when not loading) */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => { if (!loading) onClose(); }}
        />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* ── Thumbnail / Album Art ─────────────────── */}
          <View style={styles.thumbWrap}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Ionicons name="musical-notes" size={56} color={COLORS.textMuted} />
              </View>
            )}

            {/* Gradient overlay with title + artist */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.92)']}
              style={styles.thumbGrad}
            >
              <Text style={styles.thumbTitle} numberOfLines={2}>{title}</Text>
              {!!artist && (
                <Text style={styles.thumbArtist} numberOfLines={1}>{artist}</Text>
              )}
            </LinearGradient>

            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* ── Metadata chips ────────────────────────── */}
          {(duration > 0 || views > 0 || album) ? (
            <View style={styles.metaRow}>
              {duration > 0 && <MetaChip icon="time-outline" text={formatDuration(duration)} />}
              {views    > 0 && <MetaChip icon="eye-outline"  text={`${formatNumber(views)} views`} />}
              {!!album      && <MetaChip icon="disc-outline"  text={album} />}
            </View>
          ) : <View style={{ height: 8 }} />}

          {/* ── Video / Audio tabs (YouTube only) ────── */}
          {showVideoOptions && (
            <View style={styles.tabs}>
              {[
                { key: 'video', icon: 'videocam',      label: 'Video'     },
                { key: 'audio', icon: 'musical-note',  label: 'Audio MP3' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, tab === t.key && styles.tabActive]}
                  onPress={() => setTab(t.key)}
                >
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={tab === t.key ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.tabTxt, tab === t.key && styles.tabTxtActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Content area ──────────────────────────── */}
          {loading ? (
            // Loading state — shown while resolving download URL
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingTxt}>Getting download link…</Text>
              <Text style={styles.loadingSubTxt}>
                This can take 15–30 seconds. Please wait.
              </Text>
            </View>

          ) : tab === 'video' ? (
            // Video quality list (YouTube mode)
            <ScrollView
              style={styles.qualityScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {VIDEO_OPTIONS.map((opt) => (
                <VideoQualityRow key={opt.value} option={opt} onPress={onDownload} />
              ))}
            </ScrollView>

          ) : (
            // Audio-only download section (Spotify / YT Music / YouTube audio tab)
            <View style={styles.audioSection}>
              <View style={styles.audioInfo}>
                <Ionicons name="musical-notes" size={32} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.audioLabel}>High Quality MP3</Text>
                  <Text style={styles.audioSub}>Best available quality from source</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bigDownloadBtn}
                onPress={() => onDownload(AUDIO_DOWNLOAD)}
                activeOpacity={0.8}
              >
                <Ionicons name="download" size={22} color="#FFF" />
                <Text style={styles.bigDownloadTxt}>Download MP3</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },

  // Drag handle
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted + '55',
    alignSelf: 'center',
    marginTop: 10,
  },

  // Thumbnail
  thumbWrap:  { position: 'relative', height: 190, backgroundColor: COLORS.surfaceLight, marginTop: 4 },
  thumb:      { width: '100%', height: '100%' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 130,
    justifyContent: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  thumbTitle:  { color: '#FFF', fontSize: 16, fontWeight: '700', lineHeight: 22 },
  thumbArtist: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 3 },
  closeBtn: {
    position: 'absolute', top: 10, right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Metadata chips
  metaRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    maxWidth: 160,
  },
  metaText: { color: COLORS.textMuted, fontSize: 11 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10, padding: 3,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 8, gap: 6,
  },
  tabActive: { backgroundColor: COLORS.surface },
  tabTxt:    { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTxtActive: { color: COLORS.textPrimary },

  // Video quality rows
  qualityScroll: { paddingHorizontal: 16, paddingTop: 4 },
  qualityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 8,
  },
  qualityRowBest: {
    borderWidth: 1.5,
    borderColor: COLORS.primary + '55',
    backgroundColor: COLORS.primary + '0E',
  },
  qualityLeft:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qualityIconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  qualityIconWrapBest:{ backgroundColor: COLORS.primary + '22' },
  qualityLabel:       { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  qualityLabelBest:   { color: COLORS.primary, fontWeight: '700' },
  bestTag:            { color: COLORS.primary, fontSize: 11, fontWeight: '600', marginTop: 1 },
  dlBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.surfaceElevated, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  dlBtnBest: { backgroundColor: COLORS.primary },
  dlBtnTxt:  { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  dlBtnTxtBest: { color: '#FFF' },

  // Audio-only section
  audioSection: { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4 },
  audioInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.primary + '12',
    borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  audioLabel: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  audioSub:   { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  bigDownloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 16,
  },
  bigDownloadTxt: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  // Loading
  loadingBox:    { alignItems: 'center', paddingVertical: 44, gap: 14 },
  loadingTxt:    { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  loadingSubTxt: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
});
