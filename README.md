# 📱 MediaGrab — YouTube + Spotify + YouTube Music Downloader

> **Download videos and music in highest quality directly on your Android phone.**
> Built with React Native (Expo). Optimized for Samsung Galaxy S20 FE.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🎬 **YouTube Video** | Download up to 1080p (combined video+audio) |
| 🎵 **YouTube Audio** | Extract audio at highest available bitrate |
| 🎶 **YouTube Music** | Search & download from YT Music charts |
| 🟢 **Spotify** | Search tracks, download as high-quality audio |
| ⏸️ **Download Manager** | Pause, resume, retry, cancel any download |
| 📁 **Auto-save** | Saves to device gallery in MediaGrab album |
| 🌑 **AMOLED Dark Theme** | Battery-saving true-black UI |

---

## 🚀 Quick Start (Clone & Run)

```bash
# 1. Clone
git clone https://github.com/Parth-360/MediaGrab.git
cd MediaGrab

# 2. Install dependencies
npm install

# 3. Start dev server
npm start
# Scan QR code with Expo Go app on your phone
```

---

## 📦 Build APK for Android

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo (free account at expo.dev)
eas login

# Build APK (cloud build — no Android Studio needed)
eas build --platform android --profile preview
```

The build link will give you a `.apk` file. Transfer to your phone and install.

---

## ⚙️ Spotify Setup

Spotify downloads require free API credentials:

1. Go to **https://developer.spotify.com/dashboard**
2. Click **Create App** (free)
3. Copy **Client ID** and **Client Secret**
4. Open the app → **Settings** → paste credentials → **Save**

---

## 🗂️ Project Structure

```
src/
├── screens/
│   ├── HomeScreen.js          # Dashboard
│   ├── YouTubeScreen.js       # YouTube search & download
│   ├── YouTubeMusicScreen.js  # YouTube Music search & download
│   ├── SpotifyScreen.js       # Spotify search & download
│   ├── DownloadsScreen.js     # Download manager
│   └── SettingsScreen.js      # Spotify API credentials & settings
├── services/
│   ├── youtubeService.js      # InnerTube API (real stream URLs)
│   ├── youtubeMusicService.js # YouTube Music InnerTube API
│   ├── spotifyService.js      # Spotify Web API + YouTube matching
│   └── downloadService.js     # File download engine
├── components/
│   ├── SearchBar.js
│   ├── VideoCard.js
│   ├── TrackCard.js
│   ├── DownloadProgress.js
│   └── QualityModal.js
├── navigation/AppNavigator.js
├── store/downloadStore.js
├── theme/colors.js
└── utils/
    ├── constants.js
    └── helpers.js
```

---

## 📱 Optimized For

- **Samsung Galaxy S20 FE** (6.5" Super AMOLED, 120Hz)
- Android 11+ (minSdkVersion 26, targetSdkVersion 34)
- True-black AMOLED theme saves battery

---

## 🛠️ Tech Stack

- **React Native** + **Expo SDK 55**
- **YouTube InnerTube API** — same API YouTube's official app uses
- **Spotify Web API** — for metadata + track matching
- **expo-file-system** — download engine with pause/resume
- **expo-media-library** — auto-save to gallery
- **React Navigation** — tab + stack navigation

---

## ⚠️ Disclaimer

This app is for personal use only. Please respect copyright laws and the Terms of Service of YouTube and Spotify. Only download content you have the right to download.

---

*Built with ❤️ using React Native & Expo*
