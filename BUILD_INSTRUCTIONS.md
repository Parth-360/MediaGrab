# MediaGrab - Build Instructions for Samsung Galaxy S20 FE

## Prerequisites

1. **Install Node.js** (v20 or later): https://nodejs.org/
2. **Install EAS CLI** (Expo Application Services):
   ```
   npm install -g eas-cli
   ```
3. **Create a free Expo account**: https://expo.dev/signup

## Step 1: Install Dependencies

```bash
cd MediaDownloader
npm install
```

## Step 2: Create Expo Account & Login

```bash
npx eas login
```

## Step 3: Build the APK

### Option A: Cloud Build (Recommended - No Android SDK needed)

```bash
npx eas build --platform android --profile preview
```

This builds the APK on Expo's cloud servers. The APK download link will be provided when done.

### Option B: Local Build (Requires Android SDK)

```bash
npx eas build --platform android --profile local --local
```

## Step 4: Install on Samsung Galaxy S20 FE

1. Download the `.apk` file from the build link
2. Transfer to your phone (USB, email, or cloud storage)
3. On your phone: Settings > Biometrics & Security > Install unknown apps > Allow
4. Tap the APK file to install

## Spotify Setup (Required for Spotify features)

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Set any name and description
5. Set Redirect URI to `http://localhost:8888/callback`
6. Copy the **Client ID** and **Client Secret**
7. Open MediaGrab app > Settings > Paste your credentials

## Features

- **YouTube**: Search & download videos (4K/1080p/720p) or audio (320kbps MP3)
- **Spotify**: Search tracks and download as high-quality audio
- **Download Manager**: Pause, resume, retry, and manage all downloads
- **Quality Selector**: Choose video resolution or audio bitrate
- **Auto-save**: Downloads saved directly to your device storage
- **Dark Theme**: Beautiful dark UI optimized for AMOLED screens (S20 FE)

## Testing During Development

```bash
# Start the development server
npx expo start

# Scan the QR code with Expo Go app on your Samsung
```

## Samsung Galaxy S20 FE Optimizations

- Dark AMOLED theme saves battery on your Super AMOLED display
- Optimized for 6.5" screen (2400x1080 resolution)
- Android 11+ compatible (minSdkVersion 26)
- Proper permissions for Android 13+ media access
- 120Hz smooth scrolling support

## Project Structure

```
MediaDownloader/
├── App.js                          # App entry point
├── app.json                        # Expo config with Android permissions
├── eas.json                        # Build configuration
├── src/
│   ├── navigation/AppNavigator.js  # Tab + Stack navigation
│   ├── screens/
│   │   ├── HomeScreen.js           # Dashboard with stats & quick actions
│   │   ├── YouTubeScreen.js        # YouTube search & download
│   │   ├── SpotifyScreen.js        # Spotify search & download
│   │   ├── DownloadsScreen.js      # Download manager with filters
│   │   └── SettingsScreen.js       # App settings & Spotify API config
│   ├── components/
│   │   ├── SearchBar.js            # Reusable search input
│   │   ├── VideoCard.js            # YouTube video result card
│   │   ├── TrackCard.js            # Spotify track result card
│   │   ├── DownloadProgress.js     # Download item with progress bar
│   │   └── QualityModal.js         # Quality selection bottom sheet
│   ├── services/
│   │   ├── youtubeService.js       # YouTube API (via Piped)
│   │   ├── spotifyService.js       # Spotify Web API
│   │   └── downloadService.js      # Download manager engine
│   ├── store/downloadStore.js      # React hooks for state management
│   ├── theme/colors.js             # Dark theme color palette
│   └── utils/
│       ├── constants.js            # Quality options, API configs
│       └── helpers.js              # Formatting & utility functions
```

## Troubleshooting

- **Build fails**: Make sure you're logged into EAS (`npx eas login`)
- **Spotify not working**: Double-check Client ID and Secret in Settings
- **Downloads fail**: Check internet connection; some regions may need VPN
- **Permission denied**: Go to Android Settings > Apps > MediaGrab > Permissions > Allow all
