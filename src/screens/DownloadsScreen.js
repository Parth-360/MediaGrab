import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import DownloadProgress from '../components/DownloadProgress';
import { useDownloads } from '../store/downloadStore';
import {
  pauseDownload, resumeDownload, cancelDownload, retryDownload,
  deleteDownload, clearCompletedDownloads,
} from '../services/downloadService';
import { DOWNLOAD_STATUS } from '../utils/constants';

export default function DownloadsScreen({ navigation }) {
  const downloads = useDownloads();
  const [filter, setFilter] = useState('all');

  const filteredDownloads = downloads.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'active') return d.status === DOWNLOAD_STATUS.DOWNLOADING || d.status === DOWNLOAD_STATUS.PAUSED;
    if (filter === 'completed') return d.status === DOWNLOAD_STATUS.COMPLETED;
    if (filter === 'failed') return d.status === DOWNLOAD_STATUS.FAILED;
    return true;
  });

  const activeCount = downloads.filter((d) =>
    d.status === DOWNLOAD_STATUS.DOWNLOADING || d.status === DOWNLOAD_STATUS.PAUSED
  ).length;
  const completedCount = downloads.filter((d) => d.status === DOWNLOAD_STATUS.COMPLETED).length;
  const failedCount = downloads.filter((d) => d.status === DOWNLOAD_STATUS.FAILED).length;

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed',
      'Remove all completed downloads from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearCompletedDownloads() },
      ]
    );
  };

  const filters = [
    { key: 'all', label: 'All', count: downloads.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Done', count: completedCount },
    { key: 'failed', label: 'Failed', count: failedCount },
  ];

  const renderHeader = () => (
    <View>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloads</Text>
        {completedCount > 0 && (
          <TouchableOpacity onPress={handleClearCompleted} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
        {completedCount === 0 && <View style={{ width: 40 }} />}
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
            {f.count > 0 && (
              <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                  {f.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDownloads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DownloadProgress
            item={item}
            onPause={pauseDownload}
            onResume={resumeDownload}
            onCancel={cancelDownload}
            onRetry={retryDownload}
            onDelete={deleteDownload}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="download-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Downloads</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Your downloads will appear here'
                : `No ${filter} downloads`}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: COLORS.textPrimary,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterBadgeTextActive: {
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
