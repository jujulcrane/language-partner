/**
 * Audio format conversion utilities for Realtime API
 *
 * OpenAI Realtime API requires:
 * - Input: PCM16 (16-bit PCM, 24kHz, mono, little-endian)
 * - Output: PCM16 or G.711
 *
 * Expo Audio records in M4A format, so we need conversion.
 *
 * IMPLEMENTATION:
 * - Web platforms: Use Web Audio API for client-side conversion
 * - Mobile platforms: Upload to backend for FFmpeg conversion
 * - Backend endpoint: /api/audio/convert-to-pcm16
 */

import { API_BASE_URL } from '@/constants/consts';
import { auth } from '@/utils/firebaseConfig';

/**
 * Convert M4A audio file to PCM16 chunks
 *
 * @param uri - File URI from expo-av Recording
 * @returns Array of PCM16 audio chunks as ArrayBuffers
 */
export async function convertM4AToPCM16(uri: string): Promise<ArrayBuffer[]> {
  console.log('🔄 [AUDIO-CONVERTER] Converting M4A to PCM16...');
  console.log('📁 [AUDIO-CONVERTER] URI:', uri);

  try {
    // Check if we're on web platform (Web Audio API available)
    if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
      console.log('🌐 [AUDIO-CONVERTER] Web platform detected - using Web Audio API');
      return await convertM4AToPCM16Web(uri);
    }

    // For mobile platforms, use backend conversion
    console.log('📱 [AUDIO-CONVERTER] Mobile platform detected - using backend conversion');
    return await convertM4AToPCM16ViaBackend(uri);
  } catch (error) {
    console.error('❌ [AUDIO-CONVERTER] Conversion failed:', error);
    console.error('❌ [AUDIO-CONVERTER] Error details:', error instanceof Error ? error.message : String(error));
    throw error; // Re-throw so caller can handle the error
  }
}

/**
 * Convert M4A to PCM16 using Web Audio API (web platform only)
 */
async function convertM4AToPCM16Web(uri: string): Promise<ArrayBuffer[]> {
  console.log('🌐 [AUDIO-CONVERTER] Using Web Audio API for conversion');

  // Create audio context
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass({ sampleRate: 24000 });

  try {
    // Fetch the audio file
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('✅ [AUDIO-CONVERTER] Audio decoded:', {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      length: audioBuffer.length,
    });

    // Convert to mono if stereo
    let channelData: Float32Array;
    if (audioBuffer.numberOfChannels === 2) {
      // Mix stereo to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      channelData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        channelData[i] = (left[i] + right[i]) / 2;
      }
      console.log('🔀 [AUDIO-CONVERTER] Converted stereo to mono');
    } else {
      channelData = audioBuffer.getChannelData(0);
    }

    // Resample to 24kHz if needed
    let resampledData: Float32Array;
    if (audioBuffer.sampleRate !== 24000) {
      resampledData = resampleAudio(channelData, audioBuffer.sampleRate, 24000);
      console.log('🔄 [AUDIO-CONVERTER] Resampled from', audioBuffer.sampleRate, 'Hz to 24000 Hz');
    } else {
      resampledData = channelData;
    }

    // Convert float32 to int16 PCM
    const pcm16Data = float32ToInt16(resampledData);
    console.log('✅ [AUDIO-CONVERTER] Converted to PCM16:', pcm16Data.byteLength, 'bytes');

    // Split into chunks (4KB each for reasonable network transmission)
    const chunks = splitIntoChunks(pcm16Data.buffer, 4096);
    console.log('✅ [AUDIO-CONVERTER] Split into', chunks.length, 'chunks');

    audioContext.close();
    return chunks;
  } catch (error) {
    audioContext.close();
    throw error;
  }
}

/**
 * Resample audio data from one sample rate to another
 * Simple linear interpolation
 */
function resampleAudio(
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array {
  const ratio = fromSampleRate / toSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    // Linear interpolation
    result[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
  }

  return result;
}

/**
 * Convert Float32 audio samples to Int16 PCM
 */
function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1] range
    const clamped = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit integer
    int16Array[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return int16Array;
}

/**
 * Split ArrayBuffer into chunks
 */
function splitIntoChunks(buffer: ArrayBuffer, chunkSize: number): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  let offset = 0;

  while (offset < buffer.byteLength) {
    const length = Math.min(chunkSize, buffer.byteLength - offset);
    const chunk = buffer.slice(offset, offset + length);
    chunks.push(chunk);
    offset += length;
  }

  return chunks;
}

/**
 * Convert PCM16 chunks to playable audio format (WAV)
 *
 * @param chunks - Array of PCM16 ArrayBuffers from OpenAI
 * @returns ArrayBuffer containing playable audio (WAV)
 */
export async function convertPCM16ToPlayable(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
  console.log('🔄 [AUDIO-CONVERTER] Converting PCM16 chunks to WAV...');
  console.log('[AUDIO-CONVERTER] Chunks to convert:', chunks.length);

  if (chunks.length === 0) {
    console.warn('⚠️  [AUDIO-CONVERTER] No chunks to convert');
    return new ArrayBuffer(0);
  }

  // Concatenate all PCM16 chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const concatenated = new ArrayBuffer(totalLength);
  const concatenatedView = new Uint8Array(concatenated);

  let offset = 0;
  for (const chunk of chunks) {
    concatenatedView.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  console.log('✅ [AUDIO-CONVERTER] Concatenated', chunks.length, 'chunks into', totalLength, 'bytes');

  // Add WAV header to make it playable
  const wavBuffer = addWAVHeader(concatenated, 24000, 1);
  console.log('✅ [AUDIO-CONVERTER] Added WAV header, total size:', wavBuffer.byteLength, 'bytes');

  return wavBuffer;
}

/**
 * Convert ArrayBuffer to base64 string
 * Used for sending audio over WebSocket
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 * Used for receiving audio from WebSocket
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Add WAV header to PCM16 data
 * Simple conversion to make PCM16 playable
 *
 * @param pcm16Data - Raw PCM16 audio data
 * @param sampleRate - Sample rate in Hz (default: 24000 for OpenAI)
 * @param numChannels - Number of channels (default: 1 for mono)
 * @returns ArrayBuffer with WAV file
 */
export function addWAVHeader(
  pcm16Data: ArrayBuffer,
  sampleRate: number = 24000,
  numChannels: number = 1
): ArrayBuffer {
  const pcm16 = new Int16Array(pcm16Data);
  const headerSize = 44;
  const dataSize = pcm16.length * 2; // 2 bytes per sample (16-bit)
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const pcm16View = new Int16Array(buffer, headerSize);
  pcm16View.set(pcm16);

  return buffer;
}

/**
 * Helper to write string to DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Backend conversion for mobile platforms
 * Uploads M4A file to backend which converts to PCM16 chunks
 *
 * @param uri - M4A file URI
 * @returns Array of PCM16 chunks from backend
 */
export async function convertM4AToPCM16ViaBackend(uri: string): Promise<ArrayBuffer[]> {
  console.log('📤 [AUDIO-CONVERTER] Starting backend conversion...');
  console.log('📁 [AUDIO-CONVERTER] Input URI:', uri);
  console.log('🌐 [AUDIO-CONVERTER] Backend URL:', API_BASE_URL);

  try {
    // Create FormData for file upload
    const formData = new FormData();

    // React Native requires specific format for file uploads
    // expo-av provides a file:// URI that can be uploaded directly
    formData.append('audio', {
      uri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as any);

    console.log('📤 [AUDIO-CONVERTER] Uploading to:', `${API_BASE_URL}/api/audio/convert-to-pcm16`);

    const response = await fetch(`${API_BASE_URL}/api/audio/convert-to-pcm16`, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type header - let fetch set it with proper boundary
    });

    console.log('📥 [AUDIO-CONVERTER] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AUDIO-CONVERTER] Backend error response:', errorText);
      throw new Error(`Backend conversion failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    // Backend returns PCM16 chunks as JSON array of base64 strings
    const result = await response.json();
    console.log('📦 [AUDIO-CONVERTER] Received response:', {
      success: result.success,
      chunkCount: result.chunkCount,
      totalSize: result.totalSize,
    });

    if (!result.success || !result.chunks) {
      throw new Error(`Invalid response from backend: ${JSON.stringify(result)}`);
    }

    if (result.chunks.length === 0) {
      console.warn('⚠️  [AUDIO-CONVERTER] Backend returned zero chunks');
      return [];
    }

    console.log('✅ [AUDIO-CONVERTER] Received', result.chunkCount, 'chunks (', result.totalSize, 'bytes total)');

    // Convert base64 chunks to ArrayBuffers
    const chunks: ArrayBuffer[] = result.chunks.map((base64: string, index: number) => {
      const buffer = base64ToArrayBuffer(base64);
      console.log(`  📦 [AUDIO-CONVERTER] Chunk ${index + 1}/${result.chunks.length}: ${buffer.byteLength} bytes`);
      return buffer;
    });

    console.log('✅ [AUDIO-CONVERTER] Backend conversion successful! Total chunks:', chunks.length);
    return chunks;
  } catch (error) {
    console.error('❌ [AUDIO-CONVERTER] Backend conversion failed:', error);
    if (error instanceof Error) {
      console.error('❌ [AUDIO-CONVERTER] Error message:', error.message);
      console.error('❌ [AUDIO-CONVERTER] Error stack:', error.stack);
    }
    throw error;
  }
}
