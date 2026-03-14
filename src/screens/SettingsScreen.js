import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Switch, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { APP_CONFIG } from '../utils/constants';
import { useSettings } from '../store/downloadStore';
import { setSpotifyCredentials } from '../services/spotifyService';
import { formatFileSize } from '../utils/helpers';
import { getStorageInfo } from '../services/downloadService';

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings } = useSettings();
  const [clientId, setClientId] = useState(settings.spotifyClientId);
  const [clientSecret, setClientSecret] = useState(settings.spotifyClientSecret);
  const [storageInfo, setStorageInfo] = useState({ free: 0, total: 0 });
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  useEffect(() => {
    setClientId(settings.spotifyClientId);
    setClientSecret(settings.spotifyClientSecret);
  }, [settings]);

  const loadStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const saveSpotifyCredentials = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      Alert.alert('Error', 'Please enter both Client ID and Client Secret');
      return;
    }
    setSpotifyCredentials(clientId.trim(), clientSecret.trim());
    updateSettings({
      spotifyClientId: clientId.trim(),
      spotifyClientSecret: clientSecret.trim(),
    });
    Alert.alert('Saved', 'Spotify credentials saved successfully!');
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingRow = ({ icon, iconColor, label, description, right }) => (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: (iconColor || COLORS.primary) + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor || COLORS.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {right}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Spotify API Section */}
        <Section title="Spotify API Credentials">
          <Text style={styles.helpText}>
            To use Spotify features, create a free app at developer.spotify.com and enter your credentials below.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Client ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your Spotify Client ID"
              placeholderTextColor={COLORS.textMuted}
              value={clientId}
              onChangeText={setClientId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Client Secret</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Enter your Spotify Client Secret"
                placeholderTextColor={COLORS.textMuted}
                value={clientSecret}
                onChangeText={setClientSecret}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowSecret(!showSecret)}
              >
                <Ionicons
                  name={showSecret ? 'eye-off' : 'eye'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveSpotifyCredentials}>
            <Ionicons name="save-outline" size={18} color={COLORS.textPrimary} />
            <Text style={styles.saveBtnText}>Save Credentials</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Linking.openURL('https://developer.spotify.com/dashboard')}
          >
            <Ionicons name="open-outline" size={16} color={COLORS.info} />
            <Text style={styles.linkBtnText}>Open Spotify Developer Dashboard</Text>
          </TouchableOpacity>
        </Section>

        {/* Download Settings */}
        <Section title="Download Settings">
          <SettingRow
            icon="film-outline"
            label="Default Video Quality"
            description={settings.defaultVideoQuality + 'p'}
            right={
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => {
                  Alert.alert('Video Quality', 'Select default quality', [
                    { text: '2160p (4K)', onPress: () => updateSettings({ defaultVideoQuality: '2160' }) },
                    { text: '1080p (Full HD)', onPress: () => updateSettings({ defaultVideoQuality: '1080' }) },
                    { text: '720p (HD)', onPress: () => updateSettings({ defaultVideoQuality: '720' }) },
                    { text: '480p (SD)', onPress: () => updateSettings({ defaultVideoQuality: '480' }) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Text style={styles.selectBtnText}>Change</Text>
              </TouchableOpacity>
            }
          />

          <SettingRow
            icon="musical-notes-outline"
            label="Default Audio Quality"
            description={settings.defaultAudioQuality + ' kbps'}
            right={
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => {
                  Alert.alert('Audio Quality', 'Select default quality', [
                    { text: '320 kbps (Best)', onPress: () => updateSettings({ defaultAudioQuality: '320' }) },
                    { text: '256 kbps (High)', onPress: () => updateSettings({ defaultAudioQuality: '256' }) },
                    { text: '192 kbps (Good)', onPress: () => updateSettings({ defaultAudioQuality: '192' }) },
                    { text: '128 kbps (Normal)', onPress: () => updateSettings({ defaultAudioQuality: '128' }) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Text style={styles.selectBtnText}>Change</Text>
              </TouchableOpacity>
            }
          />

          <SettingRow
            icon="image-outline"
            label="Save to Gallery"
            description="Auto-save downloaded files"
            right={
              <Switch
                value={settings.saveToGallery}
                onValueChange={(val) => updateSettings({ saveToGallery: val })}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '60' }}
                thumbColor={settings.saveToGallery ? COLORS.primary : COLORS.textMuted}
              />
            }
          />

          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            description="Download completion alerts"
            right={
              <Switch
                value={settings.notifications}
                onValueChange={(val) => updateSettings({ notifications: val })}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '60' }}
                thumbColor={settings.notifications ? COLORS.primary : COLORS.textMuted}
              />
            }
          />
        </Section>

        {/* Storage */}
        <Section title="Storage">
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Ionicons name="phone-portrait-outline" size={24} color={COLORS.primary} />
              <Text style={styles.storageTitle}>Device Storage</Text>
            </View>
            <View style={styles.storageBarBg}>
              <View
                style={[
                  styles.storageBarFill,
                  {
                    width: storageInfo.total > 0
                      ? `${((storageInfo.used || 0) / storageInfo.total) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
            <View style={styles.storageInfo}>
              <Text style={styles.storageText}>
                {formatFileSize(storageInfo.free)} free
              </Text>
              <Text style={styles.storageText}>
                {formatFileSize(storageInfo.total)} total
              </Text>
            </View>
          </View>
        </Section>

        {/* About */}
        <Section title="About">
          <SettingRow
            icon="information-circle-outline"
            iconColor={COLORS.info}
            label="Version"
            description={APP_CONFIG.version}
          />
          <SettingRow
            icon="phone-portrait-outline"
            iconColor={COLORS.success}
            label="Optimized For"
            description="Samsung Galaxy S20 FE"
          />
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{APP_CONFIG.name} v{APP_CONFIG.version}</Text>
          <Text style={styles.footerSubtext}>Built with React Native & Expo</Text>
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
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  linkBtnText: {
    color: COLORS.info,
    fontSize: 13,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  selectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  selectBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  storageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  storageTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  storageBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  storageText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
    gap: 4,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  footerSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
