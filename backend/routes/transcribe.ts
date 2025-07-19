import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
const router = express.Router();
const upload = multer({ dest: 'uploads/' });


dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/speech-to-text
router.post('/api/speech-to-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('Upload received:', req.file);

    // figure out extension ('m4a' from originalna.me)
    const ext = path.extname(req.file.originalname) || '.m4a';
    const tempPathWithExt = req.file.path + ext;
    
    // Rename file to include extension, so OpenAI sees it as correct
    fs.renameSync(req.file.path, tempPathWithExt);

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPathWithExt),
      model: 'whisper-1',
    });

    fs.unlinkSync(tempPathWithExt); // Clean up

    return res.json({ text: response.text });
  } catch (error) {
    console.error('POST /api/speech-to-text error:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export default router;
