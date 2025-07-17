import express, { Request, Response } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ------------------------------------------------------------------ */
/* 1.  What a valid model response must look like                     */
/* ------------------------------------------------------------------ */
const responseSchema = z.object({
  response: z.string(),  // what the AI partner says next
  feedback: z.string(),  // grammar feedback for the learner
});
type ResponseData = z.infer<typeof responseSchema>;

/* ------------------------------------------------------------------ */
/* 2.  POST /api/generate-response                                    */
/* ------------------------------------------------------------------ */
router.post(
  '/api/generate-response',
  async (req: Request, res: Response<ResponseData | { error: string }>) => {
    try {
      /* ----- basic input validation -------------------------------- */
      const { speech } = req.body as { speech?: string };

      if (!speech || speech.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request. Provide "speech" in the body.',
        });
      }

      /* ----- build the prompt -------------------------------------- */
      const systemPrompt =
        'You are a friendly native Japanese speaker helping a learner. ' +
        'Analyse their speech, give concise grammar feedback, then reply and ' +
        'encourage them to continue in Japanese. Return ONLY valid JSON with ' +
        'keys "response" and "feedback".';

      /* ----- call OpenAI in JSON-mode ------------------------------ */
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',               // pick any model you have access to
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: speech },
        ],
        temperature: 0.7,
      });

      const raw = completion.choices[0].message.content ?? '{}';

      /* ----- validate JSON returned by the model ------------------- */
      const parsed: ResponseData = responseSchema.parse(JSON.parse(raw));

      return res.status(200).json(parsed);
    } catch (err: any) {
      console.error('generate-response error:', err);

      // OpenAI quota or 4xx/5xx? surface a readable message
      if (err.status === 429 || err.code === 'insufficient_quota') {
        return res
          .status(429)
          .json({ error: 'OpenAI quota exceeded. Check billing.' });
      }

      return res.status(500).json({ error: 'Failed to generate response.' });
    }
  }
);

export default router;
