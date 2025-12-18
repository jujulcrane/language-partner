# Talking Tanuki - Japanese Language Partner

**A full-stack, AI-powered language learning companion powered by React Native, OpenAI APIs, and ESP32 Bluetooth speaker hardware.**

[![Status](https://img.shields.io/badge/Status-Production-brightgreen)]()
[![React Native](https://img.shields.io/badge/React_Native-0.79.5-blue)]()
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange)]()
[![ESP32](https://img.shields.io/badge/ESP32-Bluetooth_A2DP-red)]()

## 📱 Overview

Talking Tanuki is an interactive, AI-powered language learning platform that helps Japanese learners practice speaking and listening in natural conversations. It combines a React Native mobile app with an optional ESP32 Bluetooth speaker for an immersive learning experience.

**Current Status: Production Ready** ✅
- Mobile app with three conversation modes
- Cloud-based AI processing (STT, LLM, TTS)
- Firebase authentication and conversation history
- ESP32 Bluetooth speaker for wireless audio playback
- 40-90% latency improvements through optimizations

## ✨ Features

### 🎤 **Three Conversation Modes**

1. **Text Mode** - Type and read Japanese
   - Manual text input for precise practice
   - Best for vocabulary and grammar review

2. **Mic Mode (Detailed)** - Traditional voice conversation
   - Full STT → LLM → TTS pipeline
   - Detailed grammar feedback after each response
   - Optimized with caching: < 500ms for common phrases
   - Standard responses: 2-6 seconds

3. **Fast Mode** ⚡ - Real-time WebSocket conversation
   - Low-latency voice chat via OpenAI Realtime API
   - Target latency: 0.8-2 seconds
   - Status: 90% complete (audio conversion pending for mobile)

### 📚 **JLPT Level Adaptation**
- Adjustable difficulty from N5 (beginner) to N1 (advanced)
- Grammar point targeting (e.g., "practice てform")
- Vocabulary appropriate for selected level

### 📊 **Progress Tracking**
- Conversation history stored in Firebase Firestore
- Session summaries and timestamps
- Review past conversations and feedback

### 🔊 **ESP32 Bluetooth Speaker**
- Wireless audio playback via Bluetooth A2DP
- Device name: "TALKING TANUKI"
- 15-line Arduino code (beautifully simple)
- Works with any Bluetooth-enabled phone

## 🏗️ System Architecture

### Current Production Setup

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)            │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Text Mode  │  │  Mic Mode    │  │  Fast Mode ⚡   │ │
│  │ (Manual)   │  │  (Detailed)  │  │  (Real-time)    │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
│         │                │                    │          │
└─────────┼────────────────┼────────────────────┼──────────┘
          │                │                    │
          │                ▼                    ▼
          │    ┌─────────────────────┐  ┌──────────────┐
          │    │  Backend (HTTP)     │  │  Backend     │
          │    │  - Speech-to-Text   │  │  (WebSocket) │
          │    │  - GPT-4o-mini LLM  │  │  Proxy       │
          │    │  - Text-to-Speech   │  │              │
          │    │  - Response Cache   │  │              │
          │    └─────────────────────┘  └──────────────┘
          │                │                    │
          │                │                    ▼
          │                │         ┌──────────────────────┐
          │                │         │ OpenAI Realtime API  │
          │                │         │ (gpt-4o-realtime)    │
          │                ▼         └──────────────────────┘
          │    ┌─────────────────────┐
          │    │  OpenAI APIs        │
          │    │  - Whisper STT      │
          │    │  - GPT-4o-mini      │
          │    │  - TTS-1 (coral)    │
          └───►└─────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
   ┌──────────────┐          ┌──────────────────┐
   │   Firebase   │          │   Bluetooth      │
   │   - Auth     │          │   ESP32 Speaker  │
   │   - Firestore│          │   "TALKING       │
   │              │          │    TANUKI"       │
   └──────────────┘          └──────────────────┘
```

### Performance Metrics

| Mode | Latency | Status |
|------|---------|--------|
| Text Mode | Instant | ✅ Production |
| Cached responses (Mic) | < 500ms | ✅ Production |
| Simple phrases (Mic) | 2-3s | ✅ Production |
| Complex responses (Mic) | 4-6s | ✅ Production |
| Fast Mode (target) | 0.8-2s | 🔄 90% complete |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- iOS/Android development environment (for mobile app)
- OpenAI API key
- Firebase project
- (Optional) ESP32 for Bluetooth speaker

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/language-partner.git
cd language-partner
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=sk-your-api-key-here
PORT=3000
NODE_ENV=development
EOF

# Add Firebase service account key
# Download from Firebase Console → Project Settings → Service Accounts
# Save as backend/serviceAccountKey.json

# Start backend
npm run dev
```

Backend runs at `http://localhost:3000`

### 3. Mobile App Setup

```bash
cd frontend
npm install

# Create .env file
cat > .env << EOF
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EOF

# Configure Firebase
# 1. Download google-services.json (Android) and GoogleService-Info.plist (iOS)
# 2. Place in frontend/ directory
# 3. Update frontend/utils/firebaseConfig.js with your config

# Start app
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator

### 4. (Optional) ESP32 Bluetooth Speaker

See [`Milstein Project Bluetooth/README.md`](./Milstein%20Project%20Bluetooth/README.md) for complete setup.

**Quick version:**
1. Install Arduino IDE or PlatformIO
2. Install libraries: ESP32-AudioI2S, ESP32-A2DP
3. Upload [`bluetooth_speaker.ino`](./Milstein%20Project%20Bluetooth/bluetooth_speaker.ino)
4. Connect speaker to GPIO 14, 15, 22
5. Pair phone with "TALKING TANUKI"

## 📁 Project Structure

```
language-partner/
├── frontend/                      # React Native mobile app
│   ├── app/                      # Expo Router screens
│   ├── components/               # UI components
│   │   ├── ConversationManager.tsx    # Main conversation orchestrator
│   │   ├── FastModeManager.tsx        # WebSocket real-time mode
│   │   └── Talk.tsx                   # Conversation UI
│   ├── hooks/                    # Custom React hooks
│   │   ├── useRealtimeConnection.ts   # WebSocket client
│   │   └── useAudioStreaming.ts       # Audio recording/playback
│   ├── utils/                    # Utilities
│   │   ├── audioConverter.ts          # M4A → PCM16 conversion
│   │   └── firebaseConfig.js          # Firebase setup
│   └── types/                    # TypeScript definitions
│
├── backend/                      # Express API server
│   ├── routes/                   # API endpoints
│   │   ├── transcribe.ts             # Speech-to-Text (Whisper)
│   │   ├── generate-response.ts      # LLM conversation (GPT-4o-mini)
│   │   ├── text-to-speech.ts         # Text-to-Speech (OpenAI TTS)
│   │   ├── realtime.ts               # WebSocket proxy (Realtime API)
│   │   ├── conversations.ts          # Firestore conversation management
│   │   └── audioConversion.ts        # Audio format conversion
│   ├── middleware/               # Middleware
│   │   ├── auth.ts                   # HTTP auth middleware
│   │   └── ws-auth.ts                # WebSocket auth
│   └── index.ts                  # Server entry point
│
├── Milstein Project Bluetooth/   # ESP32 Bluetooth speaker (DEPLOYED)
│   ├── bluetooth_speaker.ino     # 15-line Arduino code
│   ├── platformio.ini            # Build configuration
│   └── README.md                 # Hardware setup guide
│
├── Milstein Project/             # ESP32 WiFi version (IN PROGRESS)
│   ├── src/                      # Firmware source
│   │   ├── main.cpp              # Main loop
│   │   ├── i2s_audio.cpp         # I2S microphone capture
│   │   └── wifi_audio.cpp        # HTTP audio transmission
│   └── platformio.ini
│
├── tanuki-web/                   # Next.js marketing website
│
├── TECHNICAL_DOCUMENTATION.md    # Complete technical guide
├── README.md                     # This file
└── PROJECT_STRUCTURE.md          # Repository structure
```

## 🔧 Technology Stack

### Mobile App
- **Framework:** React Native 0.79.5 + Expo SDK 53
- **Language:** TypeScript 5.8.3
- **Navigation:** expo-router 5.1.3
- **Audio:** expo-av 15.1.7
- **Auth:** Firebase 12.0.0
- **State:** React hooks (useState, useRef)

### Backend
- **Runtime:** Node.js + Express 5.1.0
- **Language:** TypeScript (ES Modules)
- **AI:** OpenAI SDK 5.10.1 (Whisper, GPT-4o-mini, TTS-1, Realtime API)
- **WebSocket:** ws 8.18.3
- **Auth:** firebase-admin 13.4.0
- **Database:** Firebase Firestore

### Hardware
- **MCU:** ESP32 (any model with Bluetooth)
- **Audio Out:** I2S amplifier (MAX98357A) + speaker
- **Libraries:** ESP32-AudioI2S, ESP32-A2DP (Phil Schatzmann)
- **Protocol:** Bluetooth A2DP audio sink

## 🎯 Key Optimizations Implemented

### 1. Response Caching
- 12 common Japanese phrases cached
- **Result:** < 500ms (was 3-5s) → **85-90% improvement**

### 2. Adaptive LLM Temperature
- Lower temperature (0.5) for simple inputs → faster generation
- Higher temperature (0.7) for complex inputs → better quality
- **Result:** 30-40% faster for simple phrases

### 3. Audio Mode Optimization
- Track current audio mode to avoid redundant API calls
- **Result:** Eliminates 50-100ms per operation

### 4. Background Firestore Operations
- Database writes moved to fire-and-forget async blocks
- **Result:** Non-blocking TTS playback, ~200-500ms saved

### 5. Internal LLM Streaming
- Backend uses streaming to detect first sentence
- Prepared for future progressive TTS

## 📚 Documentation

- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - Complete technical guide (86,000+ words)
- **[Milstein Project Bluetooth/README.md](./Milstein%20Project%20Bluetooth/README.md)** - ESP32 setup guide
- **[esp32-bluetooth-verify.md](./esp32-bluetooth-verify.md)** - Verify ESP32 firmware
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Repository structure

## 🔒 Security

- All API endpoints require Firebase authentication
- User ownership verification prevents cross-user access
- Service account keys are gitignored
- WebSocket authentication via query parameters (React Native workaround)
- CORS configured for development and production

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:3000/ping
# Expected: "pong"
```

### Test Authentication
```bash
curl http://localhost:3000/api/users/test/sessions
# Expected: 401 Unauthorized
```

### Test ESP32 Bluetooth
1. Turn on ESP32
2. Check Bluetooth devices on phone
3. Look for "TALKING TANUKI"
4. Connect and play audio

## 🗺️ Development Roadmap

### ✅ Completed
- [x] React Native mobile app with three conversation modes
- [x] OpenAI API integration (STT, LLM, TTS)
- [x] Firebase authentication and Firestore database
- [x] ESP32 Bluetooth speaker integration
- [x] Response caching and optimizations (40-90% improvement)
- [x] WebSocket infrastructure for Fast Mode
- [x] JLPT level adaptation and grammar targeting

### 🔄 In Progress
- [ ] Mobile audio conversion for Fast Mode (90% complete)
- [ ] ESP32 WiFi version with INMP441 microphone

### 🎯 Planned
- [ ] Pre-generated TTS for cached responses (< 100ms target)
- [ ] User progress dashboard
- [ ] Vocabulary management and spaced repetition
- [ ] Conversation topics and scenarios
- [ ] App store submission (iOS TestFlight ready)
- [ ] Production PCB design for ESP32 hardware

## 📱 TestFlight Submission

The app is ready for TestFlight:

```bash
# Create production build
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

## 🆘 Support

- **Documentation:** See [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)
- **Issues:** Open an issue on GitHub
- **Setup Help:** Check [SETUP.md](./SETUP.md)

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini, Whisper, and TTS APIs
- **Phil Schatzmann** for ESP32-AudioI2S and ESP32-A2DP libraries
- **Firebase** for authentication and database services
- **Expo** for React Native development tools

## Submitting to testflight

1. Create a new production build:
   eas build --platform ios --profile production

2. Submit to TestFlight once the build completes:
   eas submit --platform ios --profile production
*"Practice makes perfect - 練習は完璧を作る"*
