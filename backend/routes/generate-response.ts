import express, { Request, Response } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const responseSchema = z.object({
  response: z.string(),  // what the AI partner says next
  feedback: z.string(),  // grammar feedback for the learner
});
type ResponseData = z.infer<typeof responseSchema>;

router.post(
  '/api/generate-response',
  async (req: Request, res: Response<ResponseData | { error: string }>) => {
    try {
      const { speech, jlptLevel, grammarPrompt } = req.body as { speech?: string; jlptLevel?: string; grammarPrompt?: string };

      if (!speech || speech.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request. Provide "speech" in the body.',
        });
      }

      let systemPrompt =
        'You are a friendly native Japanese speaker helping a learner. ' +
        'Analyse their speech, give concise grammar feedback, then reply and ' +
        'encourage them to continue in Japanese. Return ONLY valid JSON with ' +
        'keys "response" and "feedback".';

        if (jlptLevel) {
        systemPrompt += ` Respond ONLY at JLPT level ${jlptLevel}.`;
      }
      if (grammarPrompt) {
        systemPrompt += ` Center your reply around practicing the following grammar point: "${grammarPrompt}". ` +
                        `Make your response prompt the user to use and notice this grammar. Also, if the user's message did not use this grammar yet, encourage them to try.`;
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',               
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: speech },
        ],
        temperature: 0.7,
      });

      const raw = completion.choices[0].message.content ?? '{}';

      const parsed: ResponseData = responseSchema.parse(JSON.parse(raw));

      return res.status(200).json(parsed);
    } catch (err: any) {
      console.error('generate-response error:', err);

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
