import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import transcribeRouter from './routes/transcribe';
import generateRouter   from './routes/generate-response';
import dataRouter from './routes/data';
import conversationRouter from './routes/conversations';
import ttsRouter from './routes/text-to-speech';
import translateRouter from './routes/translate';
import audioConversionRouter from './routes/audioConversion';
import { authenticateWebSocket } from './middleware/ws-auth';
import { RealtimeSession } from './routes/realtime';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());            // <- allow Expo Go to call us
app.use(express.json());

app.get('/ping', (_req, res) => res.send('pong'));

app.use(transcribeRouter);  // /api/speech-to-text
app.use(generateRouter);    // /api/generate-response
app.use(dataRouter); // /api/items
app.use(conversationRouter);    // /api/users/:uid/sessions ..etc.
app.use(ttsRouter); // /api/text-to-speech
app.use(translateRouter); // /api/translate
app.use(audioConversionRouter); // /api/audio/convert-to-pcm16

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// Create WebSocket server for OpenAI Realtime API
const wss = new WebSocketServer({
  server,
  path: '/ws/realtime',
});

console.log('🔌 WebSocket server configured at /ws/realtime');

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
  console.log('🔗 New WebSocket connection attempt');

  // Authenticate connection
  const auth = await authenticateWebSocket(req);

  if (!auth) {
    console.warn('❌ WebSocket authentication failed - closing connection');
    ws.close(1008, 'Unauthorized');
    return;
  }

  // Create RealtimeSession
  const session = new RealtimeSession(ws, {
    userId: auth.uid,
    jlptLevel: auth.jlptLevel,
    grammarPrompt: auth.grammarPrompt,
  });

  // Connect to OpenAI
  try {
    await session.connect();
    console.log('✅ RealtimeSession connected:', session.getInfo());
  } catch (error) {
    console.error('❌ Failed to connect RealtimeSession:', error);
    ws.close(1011, 'Internal server error');
  }
});

wss.on('error', (error) => {
  console.error('❌ WebSocket server error:', error);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} on all interfaces`);
  console.log(`📡 HTTP API available at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws/realtime`);
});
