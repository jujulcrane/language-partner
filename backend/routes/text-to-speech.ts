import express from 'express';
import fetch from 'node-fetch';                // node >=18 has global fetch
import { config } from 'dotenv';
config();

const router = express.Router();

router.post('/api/text-to-speech', async (req, res) => {
  const { text, voice = 'alloy', format = 'mp3' } = req.body;

  const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: `audio/${format}`,             // tells OpenAI we want raw audio
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',              // or tts-1 / tts-1-hd
      input: text,
      voice,
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return res.status(openaiRes.status).send(err);
  }

  // proxy the binary straight through
  res.setHeader('Content-Type', `audio/${format}`);
  openaiRes.body.pipe(res);
});

export default router;
