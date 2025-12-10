import { Router, Request, Response } from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * POST /api/audio/convert-to-pcm16
 *
 * Converts M4A audio file to PCM16 format for OpenAI Realtime API
 *
 * Request: multipart/form-data with 'audio' file field
 * Response: JSON array of base64-encoded PCM16 chunks
 *
 * Audio specs:
 * - Sample rate: 24000 Hz
 * - Channels: 1 (mono)
 * - Format: PCM 16-bit little-endian
 * - Chunk size: 4096 bytes
 */
router.post('/api/audio/convert-to-pcm16', upload.single('audio'), async (req: Request, res: Response) => {
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        message: 'Please upload an audio file in the "audio" field',
      });
    }

    inputPath = req.file.path;
    outputPath = path.join(os.tmpdir(), `${Date.now()}_converted.raw`);

    console.log('🔄 [AUDIO-CONVERT] Converting audio file...');
    console.log('[AUDIO-CONVERT] Input:', inputPath);
    console.log('[AUDIO-CONVERT] Output:', outputPath);
    console.log('[AUDIO-CONVERT] Original filename:', req.file.originalname);
    console.log('[AUDIO-CONVERT] File size:', req.file.size, 'bytes');

    // Convert M4A to PCM16 using ffmpeg
    await convertToPCM16(inputPath, outputPath);

    // Read the converted PCM16 data
    const pcm16Data = await fs.readFile(outputPath);
    console.log('✅ [AUDIO-CONVERT] Conversion complete. PCM16 size:', pcm16Data.byteLength, 'bytes');

    // Split into chunks (4KB each)
    const chunks = splitIntoChunks(pcm16Data, 4096);
    console.log('📦 [AUDIO-CONVERT] Split into', chunks.length, 'chunks');

    // Convert chunks to base64 for JSON transport
    const base64Chunks = chunks.map((chunk) => chunk.toString('base64'));

    // Cleanup temp files
    await fs.unlink(inputPath).catch(console.error);
    await fs.unlink(outputPath).catch(console.error);

    return res.json({
      success: true,
      chunks: base64Chunks,
      totalSize: pcm16Data.byteLength,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error('❌ [AUDIO-CONVERT] Conversion error:', error);

    // Cleanup temp files on error
    if (inputPath) {
      await fs.unlink(inputPath).catch(console.error);
    }
    if (outputPath) {
      await fs.unlink(outputPath).catch(console.error);
    }

    return res.status(500).json({
      error: 'Audio conversion failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Convert audio file to PCM16 format using ffmpeg
 *
 * @param inputPath - Path to input audio file (M4A, MP3, WAV, etc.)
 * @param outputPath - Path to output PCM16 raw file
 */
function convertToPCM16(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(24000) // 24kHz sample rate
      .audioChannels(1) // Mono
      .audioCodec('pcm_s16le') // 16-bit PCM little-endian
      .format('s16le') // Raw PCM format
      .on('start', (commandLine) => {
        console.log('🎬 [FFMPEG] Starting conversion:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`⏳ [FFMPEG] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('✅ [FFMPEG] Conversion complete');
        resolve();
      })
      .on('error', (err, stdout, stderr) => {
        console.error('❌ [FFMPEG] Error:', err.message);
        console.error('[FFMPEG] stderr:', stderr);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Split buffer into chunks
 *
 * @param buffer - Buffer to split
 * @param chunkSize - Size of each chunk in bytes
 * @returns Array of buffer chunks
 */
function splitIntoChunks(buffer: Buffer, chunkSize: number): Buffer[] {
  const chunks: Buffer[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const length = Math.min(chunkSize, buffer.length - offset);
    const chunk = buffer.subarray(offset, offset + length);
    chunks.push(chunk);
    offset += length;
  }

  return chunks;
}

export default router;
