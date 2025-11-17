# Talking Tanuki - Mobile App (Frontend)

This is the React Native mobile application for Talking Tanuki.

## Tech Stack

- **Framework**: React Native 0.79.5 + Expo SDK 53
- **Language**: TypeScript 5.8.3
- **Navigation**: Expo Router 5 (file-based)
- **Authentication**: Firebase Auth
- **Styling**: React Native StyleSheet
- **Audio**: Expo AV

## Project Structure

```
frontend/
├── app/                    # Expo Router screens
│   ├── (dashboard)/       # Tab navigation group
│   │   ├── conversation/  # Main conversation UI
│   │   ├── history/       # Session history
│   │   └── profile/       # User profile
│   ├── auth/              # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Landing page
│
├── components/            # Reusable components
│   ├── ConversationManager.tsx
│   ├── LevelGrammarSelector.tsx
│   ├── Talk.tsx
│   └── Themed*.tsx        # Themed UI components
│
├── constants/            # App constants
│   ├── Colors.ts         # Theme colors
│   └── consts.ts         # API configuration
│
├── utils/                # Utilities
│   ├── firebaseConfig.js # Firebase client config
│   └── auth.ts           # Authentication helpers
│
└── assets/               # Images, icons, fonts
```

## Setup

### Prerequisites

- Node.js 18+
- iOS Simulator (Xcode) or Android Emulator
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and set API URL
# For local development:
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# For ngrok:
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

### Configuration

Update Firebase OAuth client IDs in `utils/auth.ts`:

```typescript
// iOS client ID (already configured)
ios: '38602504569-el8gbbg5mm9qgqegsvdpibs4u0pv85nv.apps.googleusercontent.com'

// Android client ID (update this)
android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com'
```

## Development

### Start Development Server

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go for physical device

### Run on Specific Platform

```bash
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web (experimental)
```

### Clear Cache

```bash
npx expo start --clear
```

## Features

### Authentication
- Email/password registration and login
- Google OAuth (iOS configured, Android needs client ID)
- Automatic session persistence
- Sign out functionality

### Conversation
- **Text Mode**: Type messages in Japanese
- **Mic Mode**: Record voice and transcribe with Whisper
- Real-time AI responses from GPT-4o-mini
- Text-to-speech playback of AI responses
- JLPT level selection (N5-N1)
- Custom grammar pattern targeting

### History
- View all past conversation sessions
- Expandable turns with full conversation
- Translation on-demand (Japanese → English)
- Replay audio for any turn
- Delete sessions

### Profile
- Edit display name
- View user information
- Sign out

## API Integration

All API calls are in `app/api/api.ts`:

```typescript
import { API_BASE_URL } from '@/constants/consts';

// Authenticated requests automatically include Firebase ID token
export const startSession = async (uid, jlptLevel, grammarPrompt) => {
  // Sends: Authorization: Bearer <firebase-token>
  const res = await fetch(`${API_BASE_URL}/api/users/${uid}/sessions`, {
    method: 'POST',
    headers: await createHeaders(), // Includes auth token
    body: JSON.stringify({ jlptLevel, grammarPrompt }),
  });
  // ...
};
```

## Environment Variables

```bash
# .env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Access in code:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
```

## Building for Production

### Using Expo Application Services (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Classic Build

```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

## Troubleshooting

### Metro bundler issues
```bash
npx expo start --clear
```

### iOS simulator not found
- Open Xcode
- Xcode → Preferences → Locations
- Ensure Command Line Tools is set

### Android emulator not detected
- Open Android Studio
- Tools → AVD Manager
- Start an emulator
- Ensure `ANDROID_HOME` is set

### Authentication fails
- Check Firebase config in `utils/firebaseConfig.js`
- Verify OAuth client IDs in `utils/auth.ts`
- Clear app data and sign in again

### API calls fail
- Verify backend is running: `curl http://localhost:3000/ping`
- Check `EXPO_PUBLIC_API_BASE_URL` in `.env`
- For ngrok, update URL when tunnel restarts

## Scripts

```json
{
  "start": "expo start",
  "ios": "expo start --ios",
  "android": "expo start --android",
  "web": "expo start --web"
}
```

## Dependencies

See `package.json` for full list. Key dependencies:

- `expo`: ~53.0.17
- `react`: 19.0.0
- `react-native`: 0.79.5
- `expo-router`: ~5.1.3
- `firebase`: ^12.0.0
- `expo-av`: ~15.1.7 (audio)

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Test on both iOS and Android
4. Update documentation for new features

## Related Documentation

- [Main README](../README.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Setup Guide](../SETUP.md)
- [Backend API](../backend/README.md)
