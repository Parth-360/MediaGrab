import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { QUALITY_OPTIONS } from '../utils/constants';

export default function QualityModal({ visible, onClose, onSelect, title, showVideoOptions = true }) {
  const [tab, setTab] = useState(showVideoOptions ? 'video' : 'audio');

  const options = tab === 'video' ? QUALITY_OPTIONS.video : QUALITY_OPTIONS.audio;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title || 'Select Quality'}</Text>

          {showVideoOptions && (
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, tab === 'video' && styles.tabActive]}
                onPress={() => setTab('video')}
              >
                <Ionicons name="videocam" size={18} color={tab === 'video' ? COLORS.textPrimary : COLORS.textMuted} />
                <Text style={[styles.tabText, tab === 'video' && styles.tabTextActive]}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'audio' && styles.tabActive]}
                onPress={() => setTab('audio')}
              >
                <Ionicons name="musical-note" size={18} color={tab === 'audio' ? COLORS.textPrimary : COLORS.textMuted} />
                <Text style={[styles.tabText, tab === 'audio' && styles.tabTextActive]}>Audio Only</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.optionsList}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, index === 0 && styles.optionRecommended]}
                onPress={() => onSelect({ ...option, type: tab })}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={tab === 'video' ? 'film-outline' : 'musical-notes-outline'}
                    size={20}
                    color={index === 0 ? COLORS.primary : COLORS.textSecondary}
                  />
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, index === 0 && styles.optionLabelBest]}>
                      {option.label}
                    </Text>
                    {index === 0 && (
                      <Text style={styles.recommendedTag}>Recommended</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.surfaceElevated,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: COLORS.surfaceLight,
  },
  optionRecommended: {
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '10',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionInfo: {
    gap: 2,
  },
  optionLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  optionLabelBest: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  recommendedTag: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  cancelBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
