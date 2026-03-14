import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { formatFileSize, getTimeAgo } from '../utils/helpers';
import { DOWNLOAD_STATUS } from '../utils/constants';

export default function DownloadProgress({ item, onPause, onResume, onCancel, onRetry, onDelete }) {
  const statusConfig = {
    [DOWNLOAD_STATUS.DOWNLOADING]: { icon: 'arrow-down-circle', color: COLORS.info, label: 'Downloading' },
    [DOWNLOAD_STATUS.COMPLETED]: { icon: 'checkmark-circle', color: COLORS.success, label: 'Completed' },
    [DOWNLOAD_STATUS.FAILED]: { icon: 'alert-circle', color: COLORS.error, label: 'Failed' },
    [DOWNLOAD_STATUS.PAUSED]: { icon: 'pause-circle', color: COLORS.warning, label: 'Paused' },
    [DOWNLOAD_STATUS.CANCELLED]: { icon: 'close-circle', color: COLORS.textMuted, label: 'Cancelled' },
    [DOWNLOAD_STATUS.PENDING]: { icon: 'time', color: COLORS.textMuted, label: 'Pending' },
  };

  const config = statusConfig[item.status] || statusConfig[DOWNLOAD_STATUS.PENDING];
  const progressPercent = Math.round((item.progress || 0) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={item.type === 'video' ? 'videocam' : 'musical-note'}
          size={20}
          color={item.source === 'spotify' ? COLORS.primary : COLORS.secondary}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.artist ? (
            <Text style={styles.subtitle} numberOfLines={1}>{item.artist}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      {item.status === DOWNLOAD_STATUS.DOWNLOADING && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>{progressPercent}%</Text>
            <Text style={styles.progressText}>
              {formatFileSize(item.downloadedSize)} / {formatFileSize(item.totalSize)}
            </Text>
          </View>
        </View>
      )}

      {item.status === DOWNLOAD_STATUS.COMPLETED && (
        <Text style={styles.completedText}>
          {formatFileSize(item.totalSize)} • {getTimeAgo(item.completedAt)}
        </Text>
      )}

      {item.error && (
        <Text style={styles.errorText} numberOfLines={1}>{item.error}</Text>
      )}

      <View style={styles.actions}>
        {item.status === DOWNLOAD_STATUS.DOWNLOADING && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onPause(item.id)}>
            <Ionicons name="pause" size={18} color={COLORS.warning} />
          </TouchableOpacity>
        )}
        {item.status === DOWNLOAD_STATUS.PAUSED && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onResume(item.id)}>
            <Ionicons name="play" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {item.status === DOWNLOAD_STATUS.FAILED && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onRetry(item.id)}>
            <Ionicons name="refresh" size={18} color={COLORS.info} />
          </TouchableOpacity>
        )}
        {(item.status === DOWNLOAD_STATUS.DOWNLOADING || item.status === DOWNLOAD_STATUS.PAUSED) && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onCancel(item.id)}>
            <Ionicons name="close" size={18} color={COLORS.error} />
          </TouchableOpacity>
        )}
        {(item.status === DOWNLOAD_STATUS.COMPLETED || item.status === DOWNLOAD_STATUS.FAILED || item.status === DOWNLOAD_STATUS.CANCELLED) && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.id)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 10,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  completedText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
