import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/colors';
import { formatDuration, formatNumber, truncateText } from '../utils/helpers';

export default function VideoCard({ video, onPress, onDownload }) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(video)} activeOpacity={0.7}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: video.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {video.duration > 0 && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.channel} numberOfLines={1}>
            {video.uploaderName}
          </Text>
          <View style={styles.metaRow}>
            {video.views > 0 && (
              <Text style={styles.meta}>
                {formatNumber(video.views)} views
              </Text>
            )}
            {video.uploadedDate ? (
              <Text style={styles.meta}> • {video.uploadedDate}</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => onDownload(video)}
        >
          <Ionicons name="download-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.surfaceLight,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  channel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  downloadBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
