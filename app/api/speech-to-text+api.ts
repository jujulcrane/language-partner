import OpenAI from 'openai';

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing OpenAI API Key. Please set OPENAI_API_KEY in your .env');
}

/**
 * API route for transcribing audio files using OpenAI's Whisper model
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const formData: any = await request.formData();
    const audioFile = formData.get('file');

    const openai = new OpenAI({ apiKey: API_KEY });
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    return Response.json({ text: response.text });
  } catch (error) {
    console.error('🚀 ~ POST ~ error:', error);
    return Response.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}