import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { verifyFirebaseToken } from '../middleware/auth';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit


dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/speech-to-text
router.post('/api/speech-to-text', verifyFirebaseToken, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  console.log('🎤 [STT-SERVER] Transcription request received');

  try {
    if (!req.file) {
      console.error('❌ [STT-SERVER] No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📁 [STT-SERVER] File received: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // figure out extension ('m4a' from originalna.me)
    const ext = path.extname(req.file.originalname) || '.m4a';
    const tempPathWithExt = req.file.path + ext;

    // Rename file to include extension, so OpenAI sees it as correct
    fs.renameSync(req.file.path, tempPathWithExt);
    console.log(`📝 [STT-SERVER] File renamed to: ${tempPathWithExt}`);

    const whisperStart = Date.now();
    console.log('📤 [STT-SERVER] Sending to OpenAI Whisper...');
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPathWithExt),
      model: 'whisper-1',
      language: 'ja',
    });
    console.log(`📥 [STT-SERVER] Whisper response in ${Date.now() - whisperStart}ms`);
    console.log(`📝 [STT-SERVER] Transcription: "${response.text}"`);

    fs.unlinkSync(tempPathWithExt); // Clean up

    console.log(`✅ [STT-SERVER] Total time: ${Date.now() - startTime}ms`);
    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('❌ [STT-SERVER] Error:', error);
    console.error('❌ [STT-SERVER] Error details:', error?.message, error?.response?.data);
    return res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;
