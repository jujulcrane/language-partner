/**
 * Audio Conversion Test Utility
 *
 * This utility helps test the M4A to PCM16 conversion
 * Run this from the app to verify conversion is working
 */

import { convertM4AToPCM16 } from './audioConverter';

/**
 * Test audio conversion with a recorded file
 *
 * @param m4aUri - URI of M4A file from expo-av Recording
 * @returns Test results
 */
export async function testAudioConversion(m4aUri: string) {
  console.log('🧪 [TEST] Starting audio conversion test...');
  console.log('📁 [TEST] Input file:', m4aUri);

  const startTime = Date.now();

  try {
    // Test conversion
    const chunks = await convertM4AToPCM16(m4aUri);

    const duration = Date.now() - startTime;

    // Calculate total size
    const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);

    // Calculate estimated audio duration (16-bit PCM at 24kHz)
    const sampleCount = totalBytes / 2; // 2 bytes per sample (16-bit)
    const audioDurationSeconds = sampleCount / 24000; // 24kHz sample rate

    const result = {
      success: true,
      chunkCount: chunks.length,
      totalBytes,
      audioDurationSeconds: audioDurationSeconds.toFixed(2),
      conversionTimeMs: duration,
      averageChunkSize: Math.round(totalBytes / chunks.length),
    };

    console.log('✅ [TEST] Conversion successful!');
    console.log('📊 [TEST] Results:', result);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ [TEST] Conversion failed!');
    console.error('❌ [TEST] Error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      conversionTimeMs: duration,
    };
  }
}

/**
 * Test backend connectivity
 * Verifies that the backend conversion endpoint is reachable
 */
export async function testBackendConnectivity() {
  console.log('🧪 [TEST] Testing backend connectivity...');

  try {
    const { API_BASE_URL } = await import('@/constants/consts');
    console.log('🌐 [TEST] Backend URL:', API_BASE_URL);

    // Test ping endpoint
    const response = await fetch(`${API_BASE_URL}/ping`);

    if (response.ok) {
      const text = await response.text();
      console.log('✅ [TEST] Backend is reachable!');
      console.log('📡 [TEST] Response:', text);
      return { success: true, backend: API_BASE_URL };
    } else {
      console.error('❌ [TEST] Backend returned error:', response.status);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ [TEST] Failed to reach backend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Run all tests
 */
export async function runAllTests(m4aUri?: string) {
  console.log('🧪 [TEST] Running all audio conversion tests...\n');

  // Test 1: Backend connectivity
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: Backend Connectivity');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const connectivityResult = await testBackendConnectivity();
  console.log('');

  // Test 2: Audio conversion (if file provided)
  if (m4aUri) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: Audio Conversion');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const conversionResult = await testAudioConversion(m4aUri);
    console.log('');

    return {
      connectivity: connectivityResult,
      conversion: conversionResult,
    };
  }

  return {
    connectivity: connectivityResult,
  };
}
