// routes/translate.ts
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const translateRouter = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------- validation ---------- */
const bodySchema = z.object({
  text: z.string().min(1, 'text is required'),
  // optional – defaults to ja -> en but can extend later
  sourceLang: z.string().optional(),
  targetLang: z.string().default('en').optional(),
});

const responseSchema = z.object({ translation: z.string() });
type TranslationResponse = z.infer<typeof responseSchema>;

/* ---------- endpoint ---------- */
translateRouter.post(
  '/api/translate',
  async (
    req: Request,
    res: Response<TranslationResponse | { error: string }>
  ) => {
    try {
      /* validate request */
      const { text, sourceLang = 'ja', targetLang = 'en' } =
        bodySchema.parse(req.body);

      /* build prompt */
      const systemPrompt = `You are a professional translator. Translate the user’s text from ${sourceLang} to ${targetLang}. Return ONLY valid JSON in the shape {"translation":"..."} with no extra keys or commentary.`;

      /* call OpenAI chat */
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // or gpt-3.5-turbo
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
      });

      /* parse & validate */
      const raw = completion.choices[0].message.content ?? '{}';
      const parsed = responseSchema.parse(JSON.parse(raw));

      return res.status(200).json(parsed);
    } catch (err: any) {
      /* OpenAI “quota exceeded” / 429 */
      if (err?.status === 429 || err?.code === 'insufficient_quota') {
        return res
          .status(429)
          .json({ error: 'OpenAI quota exceeded. Check billing.' });
      }

      /* bad request body */
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.message });
      }

      console.error('translate error:', err);
      return res.status(500).json({ error: 'Translation failed.' });
    }
  }
);

export default translateRouter;
