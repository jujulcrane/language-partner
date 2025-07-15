import OpenAI from 'openai';

const API_KEY = process.env.OPEN_AI_KEY;
if (!API_KEY) {
  throw new Error('OPEN_AI_KEY is not defined in environment variables');
}

export async function POST(request: Request){
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    const openai = new OpenAI({ apiKey: API_KEY });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });
    return Response.json( text: response.text);
  } catch (error) {
    console.error('Error in speech-to-text API:', error);
    return Response.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}