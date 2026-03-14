import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Image, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme/colors';
import { APP_CONFIG } from '../utils/constants';
import { useDownloads } from '../store/downloadStore';
import { DOWNLOAD_STATUS } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const downloads = useDownloads();
  const activeDownloads = downloads.filter((d) => d.status === DOWNLOAD_STATUS.DOWNLOADING);
  const completedDownloads = downloads.filter((d) => d.status === DOWNLOAD_STATUS.COMPLETED);

  const features = [
    {
      icon: 'logo-youtube',
      title: 'YouTube',
      subtitle: 'Video & Audio',
      color: '#FF0000',
      gradient: ['#FF0000', '#CC0000'],
      screen: 'YouTube',
      description: 'Download videos in 4K, 1080p, or extract audio',
    },
    {
      icon: 'musical-notes',
      title: 'Spotify',
      subtitle: 'Music & Tracks',
      color: '#1DB954',
      gradient: ['#1DB954', '#1AA34A'],
      screen: 'Spotify',
      description: 'Download tracks in high quality MP3/FLAC',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <LinearGradient
        colors={[COLORS.primary + '20', COLORS.background]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>{APP_CONFIG.name}</Text>
            <Text style={styles.tagline}>Download YouTube & Spotify Media</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="arrow-down-circle" size={28} color={COLORS.info} />
            <Text style={styles.statNumber}>{activeDownloads.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            <Text style={styles.statNumber}>{completedDownloads.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="folder" size={28} color={COLORS.primary} />
            <Text style={styles.statNumber}>{downloads.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Feature Cards */}
        <Text style={styles.sectionTitle}>Download From</Text>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.screen}
            style={styles.featureCard}
            onPress={() => navigation.navigate(feature.screen)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={feature.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featureGradient}
            >
              <View style={styles.featureContent}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon} size={40} color="#FFFFFF" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Downloads')}
          >
            <Ionicons name="download" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>My Downloads</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="cog" size={24} color={COLORS.primary} />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresList}>
          {[
            { icon: 'diamond', text: 'High quality downloads up to 4K' },
            { icon: 'musical-notes', text: '320kbps MP3 audio quality' },
            { icon: 'cloud-download', text: 'Background downloads' },
            { icon: 'folder-open', text: 'Saves directly to your device' },
            { icon: 'search', text: 'Search YouTube & Spotify' },
            { icon: 'pause-circle', text: 'Pause & resume downloads' },
          ].map((item, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              <Text style={styles.featureItemText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>v{APP_CONFIG.version}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 4,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  featureCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  featureGradient: {
    padding: 20,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  featureSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
    ...SHADOWS.small,
  },
  quickActionText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  featuresList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureItemText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },
  version: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
