import express, { Request, Response } from 'express';
import multer from 'multer';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) throw new Error('Missing OpenAI API Key.');

const openai = new OpenAI({ apiKey: API_KEY });

router.post(
  '/api/speech-to-text',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const audioPath = req.file?.path;
      if (!audioPath) throw new Error('No audio file uploaded');

      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
      });

      res.json({ text: response.text });
      // Optional: clean up the uploaded file
      fs.unlink(audioPath, () => {});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  }
);

export default router;
