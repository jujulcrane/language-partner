import { useState, useRef, useCallback, useEffect } from 'react';
import { auth } from '@/utils/firebaseConfig';
import { API_BASE_URL } from '@/constants/consts';
import type {
  RealtimeEvent,
  RealtimeServerEvent,
  ConnectionStatus,
  UseRealtimeConnectionReturn,
  ResponseAudioDeltaEvent,
  ResponseAudioTranscriptDeltaEvent,
  ResponseAudioTranscriptDoneEvent,
} from '../types/realtime';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audioConverter';

interface UseRealtimeConnectionProps {
  jlptLevel?: string;
  grammarPrompt?: string;
  onAudioChunk?: (chunk: ArrayBuffer) => void;
  onTranscriptDelta?: (delta: string) => void;
  onTranscriptDone?: (transcript: string) => void;
  onError?: (error: string) => void;
}

/**
 * React hook for managing WebSocket connection to OpenAI Realtime API
 *
 * This hook handles:
 * - WebSocket connection lifecycle
 * - Authentication via Firebase token
 * - Sending/receiving audio chunks
 * - Event handling and callbacks
 */
export function useRealtimeConnection({
  jlptLevel,
  grammarPrompt,
  onAudioChunk,
  onTranscriptDelta,
  onTranscriptDone,
  onError,
}: UseRealtimeConnectionProps = {}): UseRealtimeConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const sessionStartTimeRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false); // Prevent duplicate connections
  const audioChunksSentRef = useRef<number>(0); // Track chunks sent to prevent empty commits

  /**
   * Convert HTTP API URL to WebSocket URL
   * http://localhost:3000 → ws://localhost:3000
   * https://example.com → wss://example.com
   */
  const getWebSocketURL = useCallback(() => {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
    return `${wsUrl}/ws/realtime`;
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    // Prevent duplicate connections
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnectingRef.current) {
      console.warn('⚠️  [REALTIME] Already connected or connecting');
      return;
    }

    isConnectingRef.current = true;

    try {
      setStatus('connecting');
      setError(null);
      setTranscript('');
      audioBufferRef.current = [];
      audioChunksSentRef.current = 0; // Reset audio chunk counter
      sessionStartTimeRef.current = Date.now();

      // Get Firebase auth token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated. Please sign in first.');
      }

      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Build WebSocket URL with auth token and config
      const wsBaseUrl = getWebSocketURL();
      const url = new URL(wsBaseUrl);
      url.searchParams.set('token', token);
      if (jlptLevel) {
        url.searchParams.set('jlptLevel', jlptLevel);
      }
      if (grammarPrompt) {
        url.searchParams.set('grammarPrompt', grammarPrompt);
      }

      console.log('🔌 [REALTIME] Connecting to:', wsBaseUrl);

      // Create WebSocket connection
      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      // Set up event handlers
      ws.onopen = () => handleOpen();
      ws.onmessage = (event) => handleMessage(event);
      ws.onerror = (event) => handleError(event);
      ws.onclose = (event) => handleClose(event);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [REALTIME] Connection error:', errorMessage);
      setError(errorMessage);
      setStatus('error');
      isConnectingRef.current = false;
      onError?.(errorMessage);
    }
  }, [jlptLevel, grammarPrompt, getWebSocketURL, onError]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('🔌 [REALTIME] Disconnecting...');
      wsRef.current.close(1000, 'Client initiated disconnect');
      wsRef.current = null;
    }

    // Save session summary
    saveSessionSummary();
  }, []);

  /**
   * Handle WebSocket open event
   */
  const handleOpen = () => {
    console.log('✅ [REALTIME] Connected to WebSocket');
    setStatus('connected');
    setError(null);
    isConnectingRef.current = false;
  };

  /**
   * Handle incoming WebSocket message
   */
  const handleMessage = (event: MessageEvent) => {
    try {
      const serverEvent: RealtimeServerEvent = JSON.parse(event.data);

      // Log important events
      switch (serverEvent.type) {
        case 'session.created':
        case 'session.updated':
          console.log(`📝 [REALTIME] ${serverEvent.type}`);
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 [REALTIME] Speech started');
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🛑 [REALTIME] Speech stopped');
          break;

        case 'response.audio.delta':
          // Receive audio chunk from AI
          const audioDelta = serverEvent as ResponseAudioDeltaEvent;
          if (audioDelta.delta) {
            const audioChunk = base64ToArrayBuffer(audioDelta.delta);
            audioBufferRef.current.push(audioChunk);
            onAudioChunk?.(audioChunk);
          }
          break;

        case 'response.audio.done':
          console.log('✅ [REALTIME] Audio response complete');
          break;

        case 'response.audio_transcript.delta':
          // Receive transcript chunk
          const transcriptDelta = serverEvent as ResponseAudioTranscriptDeltaEvent;
          if (transcriptDelta.delta) {
            setTranscript((prev) => prev + transcriptDelta.delta);
            onTranscriptDelta?.(transcriptDelta.delta);
          }
          break;

        case 'response.audio_transcript.done':
          // Complete transcript
          const transcriptDone = serverEvent as ResponseAudioTranscriptDoneEvent;
          console.log('💬 [REALTIME] Transcript:', transcriptDone.transcript);
          setTranscript(transcriptDone.transcript);
          onTranscriptDone?.(transcriptDone.transcript);
          break;

        case 'error':
          console.error('❌ [REALTIME] Server error:', serverEvent.error);
          const errorMsg = serverEvent.error.message || 'Server error';
          setError(errorMsg);
          onError?.(errorMsg);
          break;

        default:
          // Other events - can be logged if needed
          break;
      }
    } catch (err) {
      console.error('❌ [REALTIME] Error parsing message:', err);
    }
  };

  /**
   * Handle WebSocket error
   */
  const handleError = (event: Event) => {
    console.error('❌ [REALTIME] WebSocket error:', event);
    setError('WebSocket connection error');
    setStatus('error');
    onError?.('WebSocket connection error');
  };

  /**
   * Handle WebSocket close
   */
  const handleClose = (event: CloseEvent) => {
    console.log('🔌 [REALTIME] Connection closed:', {
      code: event.code,
      reason: event.reason || 'No reason provided',
      wasClean: event.wasClean,
    });

    setStatus('disconnected');
    wsRef.current = null;
    isConnectingRef.current = false;

    // If closed unexpectedly (not code 1000), set error
    if (event.code !== 1000) {
      const errorMsg = `Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`;
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  /**
   * Send audio chunk to server
   */
  const sendAudioChunk = useCallback((chunk: ArrayBuffer) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️  [REALTIME] Cannot send audio - not connected');
      return;
    }

    const base64Audio = arrayBufferToBase64(chunk);
    const event: RealtimeEvent = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    };

    wsRef.current.send(JSON.stringify(event));
    audioChunksSentRef.current += 1;
    console.log(`📤 [REALTIME] Sent audio chunk ${audioChunksSentRef.current} (${chunk.byteLength} bytes)`);
  }, []);

  /**
   * Commit audio buffer (signal end of user input)
   * Only commits if audio chunks were actually sent
   */
  const commitAudio = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('⚠️  [REALTIME] Cannot commit audio - not connected');
      return;
    }

    // Validate that we've sent audio chunks
    if (audioChunksSentRef.current === 0) {
      console.warn('⚠️  [REALTIME] No audio chunks sent - skipping commit');
      console.warn('💡 [REALTIME] This is expected until audio conversion is implemented');
      return;
    }

    const event: RealtimeEvent = {
      type: 'input_audio_buffer.commit',
    };

    console.log(`✅ [REALTIME] Committing audio buffer (${audioChunksSentRef.current} chunks sent)`);
    wsRef.current.send(JSON.stringify(event));

    // Reset counter for next recording
    audioChunksSentRef.current = 0;
  }, []);

  /**
   * Clear audio buffer
   */
  const clearAudio = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    const event: RealtimeEvent = {
      type: 'input_audio_buffer.clear',
    };

    audioBufferRef.current = [];
    audioChunksSentRef.current = 0; // Reset counter
    wsRef.current.send(JSON.stringify(event));
    console.log('🧹 [REALTIME] Audio buffer cleared');
  }, []);

  /**
   * Save session summary to Firestore
   */
  const saveSessionSummary = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      const summary = transcript || 'Fast mode conversation';

      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/api/users/${user.uid}/sessions/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'realtime',
          summary,
          duration,
        }),
      });

      if (response.ok) {
        console.log('💾 [REALTIME] Session summary saved');
      } else {
        console.warn('⚠️  [REALTIME] Failed to save session summary:', response.status);
      }
    } catch (err) {
      console.error('❌ [REALTIME] Error saving session summary:', err);
      // Non-blocking error - don't throw
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Cleanup only on unmount

  return {
    status,
    error,
    connect,
    disconnect,
    sendAudioChunk,
    commitAudio,
    clearAudio,
    transcript,
  };
}
