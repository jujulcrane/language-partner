import express from 'express';
import transcribeRouter from './routes/transcribe';
import generateRouter   from './routes/generate-response';
import dataRouter from './routes/data';
import conversationRouter from './routes/conversations';
import ttsRouter from './routes/text-to-speech';
import dotenv from 'dotenv';
import cors from 'cors';
import translateRouter from './routes/translate';

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT} on all interfaces`));
