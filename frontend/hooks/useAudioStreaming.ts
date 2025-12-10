import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import type { UseAudioStreamingReturn } from '../types/realtime';
import { convertM4AToPCM16, convertPCM16ToPlayable, addWAVHeader } from '../utils/audioConverter';

interface UseAudioStreamingProps {
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  onRecordingComplete?: () => void;
  onPlaybackComplete?: () => void;
}

/**
 * React hook for audio recording and playback
 *
 * This hook manages:
 * - Recording audio using expo-av
 * - Converting M4A to PCM16 for OpenAI Realtime API
 * - Buffering and playing received PCM16 audio chunks
 *
 * CURRENT LIMITATION:
 * Expo Audio doesn't support streaming during recording.
 * We record the complete audio, then convert and send chunks.
 * This adds slight latency but is still much faster than the old pipeline.
 */
export function useAudioStreaming({
  onAudioChunk,
  onRecordingComplete,
  onPlaybackComplete,
}: UseAudioStreamingProps = {}): UseAudioStreamingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioChunks, setAudioChunks] = useState<ArrayBuffer[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioModeRef = useRef<'playback' | 'recording' | null>(null);

  /**
   * Set audio mode for recording
   */
  const setAudioModeForRecording = useCallback(async () => {
    if (audioModeRef.current === 'recording') return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    audioModeRef.current = 'recording';
    console.log('🎤 [AUDIO] Audio mode set to recording');
  }, []);

  /**
   * Set audio mode for playback
   */
  const setAudioModeForPlayback = useCallback(async () => {
    if (audioModeRef.current === 'playback') return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    audioModeRef.current = 'playback';
    console.log('🔊 [AUDIO] Audio mode set to playback');
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [AUDIO] Requesting permissions...');

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('❌ [AUDIO] Permission denied');
        throw new Error('Audio permission denied');
      }

      // Set audio mode
      await setAudioModeForRecording();

      console.log('🎤 [AUDIO] Starting recording...');

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      console.log('✅ [AUDIO] Recording started');
    } catch (err) {
      console.error('❌ [AUDIO] Failed to start recording:', err);
      throw err;
    }
  }, [setAudioModeForRecording]);

  /**
   * Stop recording and process audio
   */
  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) {
      console.warn('⚠️  [AUDIO] No active recording');
      return;
    }

    try {
      console.log('🛑 [AUDIO] Stopping recording...');

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) {
        console.error('❌ [AUDIO] No recording URI');
        return;
      }

      console.log('✅ [AUDIO] Recording stopped, URI:', uri);

      // Convert M4A to PCM16 and send chunks
      await processRecordedAudio(uri);

      onRecordingComplete?.();
    } catch (err) {
      console.error('❌ [AUDIO] Failed to stop recording:', err);
      setIsRecording(false);
      throw err;
    }
  }, [onAudioChunk, onRecordingComplete]);

  /**
   * Process recorded M4A audio and send PCM16 chunks
   */
  const processRecordedAudio = async (uri: string) => {
    try {
      console.log('🔄 [AUDIO] Converting M4A to PCM16...');

      // Convert M4A to PCM16 chunks
      const pcm16Chunks = await convertM4AToPCM16(uri);

      if (pcm16Chunks.length === 0) {
        console.warn('⚠️  [AUDIO] No PCM16 chunks generated (conversion not implemented)');
        console.warn('⚠️  [AUDIO] This is expected - audio conversion is a TODO');
        return;
      }

      console.log(`📤 [AUDIO] Sending ${pcm16Chunks.length} PCM16 chunks...`);

      // Send each chunk via callback
      for (const chunk of pcm16Chunks) {
        onAudioChunk?.(chunk);
      }

      console.log('✅ [AUDIO] All chunks sent');
    } catch (err) {
      console.error('❌ [AUDIO] Failed to process audio:', err);
      throw err;
    }
  };

  /**
   * Play buffered audio chunks
   */
  const playAudioChunks = useCallback(
    async (chunks: ArrayBuffer[]) => {
      if (chunks.length === 0) {
        console.warn('⚠️  [AUDIO] No audio chunks to play');
        return;
      }

      try {
        console.log(`🔊 [AUDIO] Playing ${chunks.length} audio chunks...`);

        // Set playback mode
        await setAudioModeForPlayback();

        // Convert PCM16 chunks to playable WAV format
        const wavBuffer = await convertPCM16ToPlayable(chunks);

        if (wavBuffer.byteLength === 0) {
          console.error('❌ [AUDIO] Conversion returned empty buffer');
          return;
        }

        // Convert to base64 data URI
        const base64 = arrayBufferToBase64(wavBuffer);
        const uri = `data:audio/wav;base64,${base64}`;

        console.log(`📊 [AUDIO] Playable audio size: ${wavBuffer.byteLength} bytes`);

        // Create and play sound
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, volume: 1 }
        );

        soundRef.current = sound;
        setIsPlaying(true);

        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) {
            if ('error' in status && status.error) {
              console.error('❌ [AUDIO] Playback error:', status.error);
            }
            return;
          }

          if (status.didJustFinish) {
            console.log('✅ [AUDIO] Playback finished');
            setIsPlaying(false);
            sound.unloadAsync();
            soundRef.current = null;
            onPlaybackComplete?.();
          }
        });

        console.log('✅ [AUDIO] Started playback');
      } catch (err) {
        console.error('❌ [AUDIO] Failed to play audio:', err);
        setIsPlaying(false);
        throw err;
      }
    },
    [setAudioModeForPlayback, onPlaybackComplete]
  );

  /**
   * Clear buffered audio chunks
   */
  const clearAudioChunks = useCallback(() => {
    setAudioChunks([]);
  }, []);

  /**
   * Stop playback
   */
  const stopPlayback = useCallback(async () => {
    if (soundRef.current) {
      console.log('🛑 [AUDIO] Stopping playback...');
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cleanup recording
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }

      // Cleanup playback
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  return {
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    playAudioChunks,
    audioChunks,
    clearAudioChunks,
  };
}

/**
 * Helper: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Use btoa if available (web), otherwise use Buffer (React Native)
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  } else {
    // React Native fallback
    return Buffer.from(bytes).toString('base64');
  }
}
