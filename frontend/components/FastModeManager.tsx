import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeConnection } from '../hooks/useRealtimeConnection';
import { useAudioStreaming } from '../hooks/useAudioStreaming';

interface FastModeManagerProps {
  jlptLevel?: string;
  grammarPrompt?: string;
}

/**
 * FastModeManager Component
 *
 * Manages real-time voice conversation using OpenAI Realtime API
 * - Low latency (~800ms vs 6000ms)
 * - WebSocket-based bidirectional audio streaming
 * - Simplified conversation history
 */
const FastModeManager: React.FC<FastModeManagerProps> = ({ jlptLevel, grammarPrompt }) => {
  const [aiResponse, setAiResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const audioChunksRef = useRef<ArrayBuffer[]>([]);

  // WebSocket connection
  const {
    status,
    error: wsError,
    connect,
    disconnect,
    sendAudioChunk,
    commitAudio,
    transcript,
  } = useRealtimeConnection({
    jlptLevel,
    grammarPrompt,
    onAudioChunk: (chunk) => {
      // Buffer audio chunks for playback
      audioChunksRef.current.push(chunk);
    },
    onTranscriptDelta: (delta) => {
      // Update AI response as it streams in
      setAiResponse((prev) => prev + delta);
    },
    onTranscriptDone: (fullTranscript) => {
      // Play buffered audio when transcript is complete
      setAiResponse(fullTranscript);
      playBufferedAudio();
    },
    onError: (errorMsg) => {
      setError(errorMsg);
    },
  });

  // Audio recording and playback
  const { isRecording, isPlaying, startRecording, stopRecording, playAudioChunks } = useAudioStreaming({
    onAudioChunk: (chunk) => {
      // Send audio chunk to WebSocket
      sendAudioChunk(chunk);
    },
    onRecordingComplete: () => {
      // Commit audio buffer when recording stops
      // The commitAudio function in useRealtimeConnection will validate
      // that chunks were actually sent before committing
      commitAudio();
    },
    onPlaybackComplete: () => {
      // Clear audio buffer after playback
      audioChunksRef.current = [];
    },
  });

  /**
   * Connect to WebSocket on mount
   * Note: Empty dependency array to connect only once
   */
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Connect only once on mount

  /**
   * Handle recording button press
   */
  const handleRecordingToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      // Clear previous response and audio
      setAiResponse('');
      setError(null);
      audioChunksRef.current = [];

      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  /**
   * Play buffered audio chunks
   */
  const playBufferedAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      console.warn('⚠️  [FAST-MODE] No audio chunks to play');
      return;
    }

    try {
      console.log(`🔊 [FAST-MODE] Playing ${audioChunksRef.current.length} audio chunks`);
      await playAudioChunks(audioChunksRef.current);
    } catch (err) {
      console.error('❌ [FAST-MODE] Playback error:', err);
      setError('Audio playback failed. Please try again.');
    }
  }, [playAudioChunks]);

  /**
   * Render connection status indicator
   */
  const renderStatusIndicator = () => {
    let statusText = '';
    let statusColor = '#666';

    switch (status) {
      case 'connecting':
        statusText = 'Connecting...';
        statusColor = '#FFC107';
        break;
      case 'connected':
        statusText = 'Connected - Tap to speak';
        statusColor = '#4CAF50';
        break;
      case 'disconnected':
        statusText = 'Disconnected';
        statusColor = '#666';
        break;
      case 'error':
        statusText = 'Connection Error';
        statusColor = '#F44336';
        break;
    }

    return (
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      {renderStatusIndicator()}

      {/* AI Response */}
      {aiResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>たぬきちゃん:</Text>
          <Text style={styles.responseText}>{aiResponse}</Text>
        </View>
      )}

      {/* Error Message */}
      {(error || wsError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || wsError}</Text>
        </View>
      )}

      {/* Recording Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleRecordingToggle}
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? '#F44336' : '#53C1DE',
              opacity: status !== 'connected' || isPlaying ? 0.6 : 1,
            },
          ]}
          disabled={status !== 'connected' || isPlaying}
        >
          <Ionicons
            name={isRecording ? 'stop-circle' : 'mic-circle'}
            size={44}
            color="white"
          />
        </TouchableOpacity>

        {/* Loading Indicator */}
        {isPlaying && <ActivityIndicator style={styles.loadingIndicator} size="large" />}
      </View>

      {/* Info Text */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {isRecording
            ? '🎤 Recording... Tap to stop'
            : isPlaying
            ? '🔊 Playing response...'
            : status === 'connected'
            ? '✨ Fast Mode - Low latency voice chat'
            : '⏳ Waiting for connection...'}
        </Text>
      </View>

      {/* Settings Display */}
      {(jlptLevel || grammarPrompt) && (
        <View style={styles.settingsContainer}>
          {jlptLevel && (
            <Text style={styles.settingsText}>Level: {jlptLevel}</Text>
          )}
          {grammarPrompt && (
            <Text style={styles.settingsText}>Focus: {grammarPrompt}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  responseContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    maxWidth: '90%',
    alignSelf: 'flex-start',
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  transcriptContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    maxWidth: '90%',
    alignSelf: 'flex-end',
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    maxWidth: '90%',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingIndicator: {
    marginTop: 16,
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  settingsText: {
    fontSize: 12,
    color: '#E65100',
    marginBottom: 4,
  },
});

export default FastModeManager;
