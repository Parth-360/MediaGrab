import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { formatDuration } from '../utils/helpers';

export default function TrackCard({ track, onPress, onDownload }) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(track)} activeOpacity={0.7}>
      <Image
        source={{ uri: track.albumArtSmall || track.albumArt }}
        style={styles.albumArt}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.album} numberOfLines={1}>
            {track.album}
          </Text>
          {track.duration > 0 && (
            <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
          )}
        </View>
      </View>
      {track.explicit && (
        <View style={styles.explicitBadge}>
          <Text style={styles.explicitText}>E</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => onDownload(track)}
      >
        <Ionicons name="download-outline" size={22} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 10,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceLight,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  album: {
    color: COLORS.textMuted,
    fontSize: 12,
    flex: 1,
  },
  duration: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  explicitBadge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  explicitText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: '800',
  },
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
