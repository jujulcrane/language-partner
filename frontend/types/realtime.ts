// Frontend types for OpenAI Realtime API
// Subset of backend types needed for client-side communication

export type RealtimeEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ResponseCancelEvent;

export type RealtimeServerEvent =
  | ErrorEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent;

// Client → Server Events

export interface SessionUpdateEvent {
  type: 'session.update';
  session: Record<string, unknown>;
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string; // base64 encoded PCM16 audio
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

export interface InputAudioBufferClearEvent {
  type: 'input_audio_buffer.clear';
}

export interface ResponseCancelEvent {
  type: 'response.cancel';
}

// Server → Client Events

export interface ErrorEvent {
  type: 'error';
  error: {
    type: string;
    code?: string;
    message: string;
  };
}

export interface SessionCreatedEvent {
  type: 'session.created';
  session: Record<string, unknown>;
}

export interface SessionUpdatedEvent {
  type: 'session.updated';
  session: Record<string, unknown>;
}

export interface InputAudioBufferSpeechStartedEvent {
  type: 'input_audio_buffer.speech_started';
  audio_start_ms: number;
  item_id: string;
}

export interface InputAudioBufferSpeechStoppedEvent {
  type: 'input_audio_buffer.speech_stopped';
  audio_end_ms: number;
  item_id: string;
}

export interface ResponseCreatedEvent {
  type: 'response.created';
  response: {
    id: string;
    status: string;
  };
}

export interface ResponseDoneEvent {
  type: 'response.done';
  response: {
    id: string;
    status: string;
  };
}

export interface ResponseAudioDeltaEvent {
  type: 'response.audio.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string; // base64 encoded PCM16 audio chunk
}

export interface ResponseAudioDoneEvent {
  type: 'response.audio.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
}

export interface ResponseAudioTranscriptDeltaEvent {
  type: 'response.audio_transcript.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseAudioTranscriptDoneEvent {
  type: 'response.audio_transcript.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

// Connection states

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Hook return types

export interface UseRealtimeConnectionReturn {
  status: ConnectionStatus;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudioChunk: (chunk: ArrayBuffer) => void;
  commitAudio: () => void;
  clearAudio: () => void;
  transcript: string;
}

export interface UseAudioStreamingReturn {
  isRecording: boolean;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playAudioChunks: (chunks: ArrayBuffer[]) => Promise<void>;
  audioChunks: ArrayBuffer[];
  clearAudioChunks: () => void;
}
