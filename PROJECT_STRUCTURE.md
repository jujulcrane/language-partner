# Talking Tanuki - Project Structure

This is a monorepo containing all components of the Talking Tanuki platform.

## 📁 Repository Structure

```
talking-tanuki/
├── frontend/              # React Native mobile app (iOS/Android)
│   ├── app/              # Expo Router screens
│   ├── components/       # Reusable React components
│   ├── constants/        # App constants and configuration
│   ├── utils/           # Utility functions (Firebase, auth)
│   ├── assets/          # Images, icons, splash screens
│   ├── package.json     # Frontend dependencies
│   └── .env             # Frontend environment variables
│
├── backend/              # Express.js API server
│   ├── routes/          # API route handlers
│   ├── middleware/      # Auth and other middleware
│   ├── firebaseAdmin.ts # Firebase Admin SDK setup
│   ├── index.ts         # Server entry point
│   ├── package.json     # Backend dependencies
│   └── .env             # Backend environment variables
│
├── tanuki-web/           # Next.js marketing website
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   ├── public/          # Static assets
│   └── package.json     # Web dependencies
│
├── Milstein Project/     # ESP32 hardware firmware
│   ├── src/             # Firmware source code
│   └── platformio.ini   # PlatformIO configuration
│
├── docs/                # Documentation
├── package.json         # Root workspace configuration
├── README.md           # Main project README
├── SETUP.md            # Setup instructions
└── SECURITY_FIXES.md   # Security documentation
```

## 🚀 Quick Start

### Install All Dependencies

```bash
# From root directory
npm run install:all
```

Or install individually:

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install

# Website
cd tanuki-web && npm install
```

### Run Everything

```bash
# From root directory - runs backend and frontend concurrently
npm run dev
```

Or run individually:

```bash
# Backend server (port 3000)
npm run backend

# Frontend mobile app
npm run frontend
npm run frontend:ios      # iOS simulator
npm run frontend:android  # Android emulator

# Marketing website (port 3001)
npm run web
```

## 📦 Components

### Frontend - React Native Mobile App

**Technology Stack:**
- React Native 0.79.5
- Expo SDK 53
- TypeScript
- Firebase Authentication
- Expo Router (file-based navigation)

**Key Features:**
- Email/password and Google OAuth authentication
- Voice and text conversation with AI
- JLPT level selection (N5-N1)
- Custom grammar targeting
- Session history and playback
- Translation on-demand

**Development:**
```bash
cd frontend
npm start           # Start Metro bundler
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

### Backend - Express API Server

**Technology Stack:**
- Node.js + Express 5
- TypeScript (ES Modules)
- Firebase Admin SDK
- OpenAI API (GPT-4o-mini, Whisper, TTS)
- Firestore

**Key Features:**
- RESTful API endpoints
- Firebase authentication middleware
- User data isolation
- OpenAI API integration
- File upload handling

**Development:**
```bash
cd backend
npm run dev        # Development with hot reload
npm start          # Production mode
```

**API Endpoints:**
- `GET /ping` - Health check
- `POST /api/speech-to-text` - Whisper STT
- `POST /api/generate-response` - AI conversation
- `POST /api/text-to-speech` - OpenAI TTS
- `POST /api/translate` - Japanese → English
- `/api/users/:uid/*` - User data management

### Tanuki-Web - Marketing Website

**Technology Stack:**
- Next.js 14
- React 18
- TypeScript
- Server-side rendering

**Features:**
- Landing page
- Product showcase
- Download links (coming soon)
- Blog/documentation (planned)

**Development:**
```bash
cd tanuki-web
npm install        # First time only
npm run dev        # Development server (http://localhost:3001)
npm run build      # Production build
```

### Milstein Project - ESP32 Hardware

**Technology Stack:**
- ESP32-S3 DevKitC-1
- PlatformIO
- C++/Arduino
- I2S audio components

**Features:**
- WiFi connectivity
- I2S microphone input
- I2S speaker output
- Physical conversation device

**Development:**
- Open in PlatformIO IDE
- Build and upload to ESP32 board

## 🔧 Environment Variables

### Frontend (.env)
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Backend (.env)
```bash
OPENAI_API_KEY=sk-...
PORT=3000
NODE_ENV=development
```

### Firebase Configuration

Both frontend and backend require Firebase configuration:

**Frontend:**
- `frontend/utils/firebaseConfig.js` - Client SDK config
- `frontend/GoogleService-Info (1).plist` - iOS config

**Backend:**
- `backend/serviceAccountKey.json` - Admin SDK key (not in git)

## 🔒 Security

- All API endpoints require Firebase authentication
- User ownership verification prevents cross-user access
- Service account keys and environment variables are gitignored
- CORS configured for development and production

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [SECURITY_FIXES.md](./SECURITY_FIXES.md) - Security improvements
- [frontend/README.md](./frontend/README.md) - Mobile app docs (see main README)
- [backend/README.md](./backend/README.md) - API documentation (to be created)
- [tanuki-web/README.md](./tanuki-web/README.md) - Website docs

## 🧪 Testing

```bash
# Backend health check
curl http://localhost:3000/ping

# Backend authentication test (should return 401)
curl http://localhost:3000/api/users/test/sessions
```

## 📈 Roadmap

### Mobile App
- [ ] Advanced grammar tracking
- [ ] Vocabulary management
- [ ] Progress dashboard
- [ ] Spaced repetition system
- [ ] Conversation topics/scenarios
- [ ] App store submission

### Backend
- [ ] Rate limiting
- [ ] Caching layer
- [ ] Analytics integration
- [ ] Admin dashboard API
- [ ] Batch operations

### Website
- [ ] Landing page design
- [ ] Download links
- [ ] Blog system
- [ ] Documentation portal
- [ ] User testimonials

### Hardware
- [ ] Production PCB design
- [ ] Custom enclosure
- [ ] Battery optimization
- [ ] OTA firmware updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- Check [SETUP.md](./SETUP.md) for setup help
- Open an issue on GitHub
- Contact the development team

---

**Built with ❤️ for Japanese language learners**
