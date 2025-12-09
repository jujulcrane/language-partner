import express, { Request, Response } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { verifyFirebaseToken } from '../middleware/auth';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const responseSchema = z.object({
  response: z.string(),  // what the AI partner says next
  feedback: z.string(),  // grammar feedback for the learner
});
type ResponseData = z.infer<typeof responseSchema>;

// OPTIMIZATION: Cache for common responses (instant responses!)
const responseCache = new Map<string, ResponseData>([
  ['こんにちは', {
    response: 'こんにちは！元気ですか？',
    feedback: '完璧な挨拶です！「元気です」で答えてみましょう。'
  }],
  ['こんにちは。', {
    response: 'こんにちは！元気ですか？',
    feedback: '完璧な挨拶です！「元気です」で答えてみましょう。'
  }],
  ['ありがとう', {
    response: 'どういたしまして！もっと練習しましょう。',
    feedback: 'とても良いです！丁寧に言う時は「ありがとうございます」を使います。'
  }],
  ['ありがとうございます', {
    response: 'どういたしまして！とても丁寧ですね。',
    feedback: '完璧です！丁寧な表現ができています。'
  }],
  ['おはよう', {
    response: 'おはようございます！今日も頑張りましょう。',
    feedback: '良い挨拶です！丁寧に「おはようございます」と言うこともできます。'
  }],
  ['おはようございます', {
    response: 'おはようございます！今日は何をしますか？',
    feedback: '完璧な朝の挨拶です！'
  }],
  ['こんばんは', {
    response: 'こんばんは！今日はどうでしたか？',
    feedback: '良い挨拶です！'
  }],
  ['元気です', {
    response: 'それは良かったです！今日は何をしましたか？',
    feedback: '良いですね！「元気です」は「げんきです」と読みます。'
  }],
  ['はい', {
    response: 'わかりました！続けましょう。',
    feedback: '「はい」は丁寧な返事です。カジュアルには「うん」も使えます。'
  }],
  ['いいえ', {
    response: 'そうですか。では、何か他のことを話しましょう。',
    feedback: '「いいえ」は丁寧な否定です。カジュアルには「ううん」も使えます。'
  }],
  ['さようなら', {
    response: 'さようなら！また話しましょう！',
    feedback: '完璧です！カジュアルには「じゃあね」や「またね」も使えます。'
  }],
  ['またね', {
    response: 'またね！楽しかったです！',
    feedback: 'カジュアルな別れの挨拶です！完璧です。'
  }],
]);

// OPTIMIZED VERSION - Faster response with streaming internally
router.post(
  '/api/generate-response',
  verifyFirebaseToken,
  async (req: Request, res: Response<ResponseData | { error: string }>) => {
    const startTime = Date.now();
    console.log('⚡ [LLM-OPTIMIZED] Response generation request received (streaming internally)');

    try {
      const { speech, jlptLevel, grammarPrompt } = req.body as { speech?: string; jlptLevel?: string; grammarPrompt?: string };

      console.log(`📝 [LLM-SERVER] User input: "${speech?.substring(0, 100)}"`);
      console.log(`📊 [LLM-SERVER] JLPT Level: ${jlptLevel || 'none'}, Grammar: ${grammarPrompt || 'none'}`);

      if (!speech || speech.trim().length === 0) {
        console.error('❌ [LLM-SERVER] Empty speech provided');
        return res.status(400).json({
          error: 'Invalid request. Provide "speech" in the body.',
        });
      }

      // OPTIMIZATION: Check cache first for instant responses!
      const normalizedSpeech = speech.trim().toLowerCase();
      const cached = responseCache.get(normalizedSpeech);
      if (cached) {
        console.log(`⚡ [CACHE-HIT] Instant response for: "${speech}"`);
        console.log(`⏱️ [CACHE-HIT] Total time: ${Date.now() - startTime}ms (INSTANT!)`);
        return res.status(200).json(cached);
      }
      console.log('📝 [CACHE-MISS] Not in cache, generating response...');

      // OPTIMIZATION: Use structured text format instead of JSON to enable streaming in future
      let systemPrompt =
        'Your name is Tanuki Chan and you are a friendly native Japanese speaker helping a learner. ' +
        'Analyse their speech, give concise grammar feedback, then reply and ' +
        'encourage them to continue in Japanese.\n\n' +
        'Format your response EXACTLY as follows:\n' +
        'RESPONSE: [Your Japanese reply to the user]\n' +
        'FEEDBACK: [Your concise grammar feedback]';

        if (jlptLevel) {
        systemPrompt += `\n\nRespond ONLY at JLPT level ${jlptLevel}.`;
      }
      if (grammarPrompt) {
        systemPrompt += `\n\nCenter your reply around practicing the following grammar point: "${grammarPrompt}". ` +
                        `Make your response prompt the user to use and notice this grammar. Also, if the user's message did not use this grammar yet, encourage them to try.`;
      }

      const llmStart = Date.now();
      console.log('📤 [LLM-OPTIMIZED] Sending to OpenAI with streaming...');

      // OPTIMIZATION: Use lower temperature for simple inputs (faster generation)
      const isSimpleInput = speech.length < 20;
      const temperature = isSimpleInput ? 0.5 : 0.7;
      if (isSimpleInput) {
        console.log('⚡ [LLM-OPTIMIZED] Simple input detected, using temperature 0.5 for faster generation');
      }

      // Use streaming internally for faster response
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: speech },
        ],
        temperature,
        stream: true,  // Stream internally to get first sentence faster
      });

      let fullContent = '';
      let firstSentence = '';
      let firstSentenceTime: number | null = null;

      // Stream and detect first sentence
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;

        // Detect first sentence (for internal optimization)
        if (!firstSentenceTime && /[。！？]/.test(fullContent)) {
          const match = fullContent.match(/RESPONSE:\s*(.+?[。！？])/);
          if (match) {
            firstSentence = match[1].trim();
            firstSentenceTime = Date.now();
            console.log(`🎯 [LLM-OPTIMIZED] First sentence ready in ${firstSentenceTime - llmStart}ms: "${firstSentence}"`);
          }
        }
      }

      console.log(`📥 [LLM-OPTIMIZED] Stream complete in ${Date.now() - llmStart}ms`);
      console.log(`📝 [LLM-OPTIMIZED] Full content: "${fullContent.substring(0, 150)}..."`);

      // Parse structured text response
      const responseMatch = fullContent.match(/RESPONSE:\s*([\s\S]+?)(?=\nFEEDBACK:|$)/);
      const feedbackMatch = fullContent.match(/FEEDBACK:\s*([\s\S]+?)$/);

      const parsed: ResponseData & { firstSentence?: string } = {
        response: responseMatch?.[1]?.trim() || 'こんにちは！',
        feedback: feedbackMatch?.[1]?.trim() || 'Keep practicing!',
        firstSentence: firstSentence || undefined,  // Send first sentence separately
      };

      console.log(`✅ [LLM-OPTIMIZED] Parsed response: "${parsed.response?.substring(0, 50)}..."`);
      console.log(`✅ [LLM-OPTIMIZED] Parsed feedback: "${parsed.feedback?.substring(0, 50)}..."`);

      if (firstSentenceTime) {
        console.log(`⚡ [LLM-OPTIMIZED] Time saved by detecting first sentence: ${(Date.now() - firstSentenceTime)}ms`);
      }

      // Validate with schema
      responseSchema.parse(parsed);

      console.log(`⏱️ [LLM-OPTIMIZED] Total time: ${Date.now() - startTime}ms`);
      return res.status(200).json(parsed);
    } catch (err: any) {
      console.error('❌ [LLM-SERVER] Error:', err);
      console.error('❌ [LLM-SERVER] Error details:', err?.message, err?.response?.data);

      if (err.status === 429 || err.code === 'insufficient_quota') {
        return res
          .status(429)
          .json({ error: 'OpenAI quota exceeded. Check billing.' });
      }

      return res.status(500).json({ error: 'Failed to generate response.' });
    }
  }
);

// STREAMING VERSION - New endpoint for streaming responses
router.post(
  '/api/generate-response-stream',
  verifyFirebaseToken,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    console.log('🌊 [LLM-STREAM] Streaming response generation started');

    try {
      const { speech, jlptLevel, grammarPrompt } = req.body as { speech?: string; jlptLevel?: string; grammarPrompt?: string };

      console.log(`📝 [LLM-STREAM] User input: "${speech?.substring(0, 100)}"`);

      if (!speech || speech.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid request. Provide "speech" in the body.' });
      }

      // Set up Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let systemPrompt =
        'Your name is Tanuki Chan and you are a friendly native Japanese speaker helping a learner. ' +
        'Analyse their speech, give concise grammar feedback, then reply and ' +
        'encourage them to continue in Japanese.\n\n' +
        'Format your response EXACTLY as follows:\n' +
        'RESPONSE: [Your Japanese reply to the user]\n' +
        'FEEDBACK: [Your concise grammar feedback]';

      if (jlptLevel) {
        systemPrompt += `\n\nRespond ONLY at JLPT level ${jlptLevel}.`;
      }
      if (grammarPrompt) {
        systemPrompt += `\n\nCenter your reply around practicing the following grammar point: "${grammarPrompt}". ` +
                        `Make your response prompt the user to use and notice this grammar. Also, if the user's message did not use this grammar yet, encourage them to try.`;
      }

      const llmStart = Date.now();
      console.log('📤 [LLM-STREAM] Starting streaming from OpenAI...');

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: speech },
        ],
        temperature: 0.7,
        stream: true,  // Enable streaming!
      });

      let fullContent = '';
      let buffer = '';
      let inResponseSection = false;
      let responseSent = false;
      let firstSentenceTime: number | null = null;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (!content) continue;

        fullContent += content;
        buffer += content;

        // Detect when we're in the RESPONSE section
        if (buffer.includes('RESPONSE:')) {
          inResponseSection = true;
          buffer = buffer.split('RESPONSE:')[1] || '';
        }

        // Detect sentence boundaries in Japanese (。！？)
        if (inResponseSection && !responseSent && /[。！？]/.test(buffer)) {
          // Extract first sentence
          const sentenceMatch = buffer.match(/^(.+?[。！？])/);
          if (sentenceMatch) {
            const firstSentence = sentenceMatch[1].trim();
            firstSentenceTime = Date.now();

            console.log(`🎯 [LLM-STREAM] First sentence ready in ${firstSentenceTime - llmStart}ms: "${firstSentence}"`);

            // Send first sentence to frontend immediately!
            res.write(`data: ${JSON.stringify({ type: 'first_sentence', content: firstSentence })}\n\n`);
            responseSent = true;
          }
        }

        // Check if we've moved to FEEDBACK section
        if (buffer.includes('FEEDBACK:')) {
          inResponseSection = false;
        }
      }

      console.log(`📥 [LLM-STREAM] Stream complete in ${Date.now() - llmStart}ms`);
      console.log(`📝 [LLM-STREAM] Full content: "${fullContent.substring(0, 150)}..."`);

      // Parse complete response
      const responseMatch = fullContent.match(/RESPONSE:\s*([\s\S]+?)(?=\nFEEDBACK:|$)/);
      const feedbackMatch = fullContent.match(/FEEDBACK:\s*([\s\S]+?)$/);

      const parsed = {
        response: responseMatch?.[1]?.trim() || 'こんにちは！',
        feedback: feedbackMatch?.[1]?.trim() || 'Keep practicing!',
      };

      console.log(`✅ [LLM-STREAM] Complete response: "${parsed.response?.substring(0, 50)}..."`);
      console.log(`✅ [LLM-STREAM] Feedback: "${parsed.feedback?.substring(0, 50)}..."`);

      // Send complete response
      res.write(`data: ${JSON.stringify({ type: 'complete', ...parsed })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();

      console.log(`⏱️ [LLM-STREAM] Total time: ${Date.now() - startTime}ms`);
      if (firstSentenceTime) {
        console.log(`⚡ [LLM-STREAM] Time saved: ${(Date.now() - firstSentenceTime)}ms (TTS started early!)`);
      }

    } catch (err: any) {
      console.error('❌ [LLM-STREAM] Error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    }
  }
);

export default router;
