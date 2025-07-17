import express from 'express';
import transcribeRouter from './routes/transcribe';
import generateRouter   from './routes/generate-response';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());            // <- allow Expo Go to call us
app.use(express.json());

app.get('/ping', (_req, res) => res.send('pong'));

app.use(transcribeRouter);  // /api/speech-to-text
app.use(generateRouter);    // /api/generate-response

app.listen(3000, () => console.log('Server running on port 3000'));
