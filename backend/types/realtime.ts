// OpenAI Realtime API Event Types
// Reference: https://platform.openai.com/docs/api-reference/realtime

export type RealtimeEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ResponseCreateEvent
  | ResponseCancelEvent
  | ConversationItemCreateEvent;

export type RealtimeServerEvent =
  | ErrorEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | ConversationCreatedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ConversationItemCreatedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | RateLimitsUpdatedEvent;

// Client → Server Events

export interface SessionUpdateEvent {
  type: 'session.update';
  session: Partial<SessionConfig>;
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

export interface ResponseCreateEvent {
  type: 'response.create';
  response?: {
    modalities?: ('text' | 'audio')[];
    instructions?: string;
    voice?: Voice;
    output_audio_format?: AudioFormat;
    tools?: Tool[];
    tool_choice?: string | 'auto' | 'none' | 'required';
    temperature?: number;
    max_output_tokens?: number | 'inf';
  };
}

export interface ResponseCancelEvent {
  type: 'response.cancel';
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create';
  item: ConversationItem;
}

// Server → Client Events

export interface ErrorEvent {
  type: 'error';
  error: {
    type: string;
    code?: string;
    message: string;
    param?: string;
    event_id?: string;
  };
}

export interface SessionCreatedEvent {
  type: 'session.created';
  session: SessionConfig;
}

export interface SessionUpdatedEvent {
  type: 'session.updated';
  session: SessionConfig;
}

export interface ConversationCreatedEvent {
  type: 'conversation.created';
  conversation: {
    id: string;
    object: 'realtime.conversation';
  };
}

export interface InputAudioBufferCommittedEvent {
  type: 'input_audio_buffer.committed';
  previous_item_id: string;
  item_id: string;
}

export interface InputAudioBufferClearedEvent {
  type: 'input_audio_buffer.cleared';
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

export interface ConversationItemCreatedEvent {
  type: 'conversation.item.created';
  previous_item_id: string | null;
  item: ConversationItem;
}

export interface ResponseCreatedEvent {
  type: 'response.created';
  response: Response;
}

export interface ResponseDoneEvent {
  type: 'response.done';
  response: Response;
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

export interface ResponseTextDeltaEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface ResponseTextDoneEvent {
  type: 'response.text.done';
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
}

export interface RateLimitsUpdatedEvent {
  type: 'rate_limits.updated';
  rate_limits: RateLimit[];
}

// Supporting Types

export type Voice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
export type AudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';
export type Modality = 'text' | 'audio';

export interface SessionConfig {
  id?: string;
  object?: 'realtime.session';
  model?: string;
  expires_at?: number;
  modalities?: Modality[];
  instructions?: string;
  voice?: Voice;
  input_audio_format?: AudioFormat;
  output_audio_format?: AudioFormat;
  input_audio_transcription?: {
    model: 'whisper-1';
  } | null;
  turn_detection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  } | null;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | 'required';
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
}

export interface Tool {
  type: 'function';
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ConversationItem {
  id?: string;
  type: 'message' | 'function_call' | 'function_call_output';
  status?: 'in_progress' | 'completed' | 'incomplete';
  role?: 'user' | 'assistant' | 'system';
  content?: ContentPart[];
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
}

export interface ContentPart {
  type: 'input_text' | 'input_audio' | 'item_reference' | 'text' | 'audio';
  text?: string;
  audio?: string; // base64 encoded
  transcript?: string;
  id?: string;
}

export interface Response {
  id: string;
  object: 'realtime.response';
  status: 'in_progress' | 'completed' | 'cancelled' | 'failed' | 'incomplete';
  status_details?: {
    type?: 'cancelled' | 'incomplete' | 'failed';
    reason?: string;
    error?: {
      type: string;
      code?: string;
      message: string;
    };
  };
  output: ConversationItem[];
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    input_token_details?: {
      cached_tokens: number;
      text_tokens: number;
      audio_tokens: number;
    };
    output_token_details?: {
      text_tokens: number;
      audio_tokens: number;
    };
  };
}

export interface RateLimit {
  name: string;
  limit: number;
  remaining: number;
  reset_seconds: number;
}

// Custom types for our app

export interface RealtimeConnectionConfig {
  jlptLevel?: string;
  grammarPrompt?: string;
  userId: string;
}

export interface ConversationSummary {
  sessionId: string;
  userId: string;
  mode: 'realtime';
  summary: string;
  duration: number; // in seconds
  createdAt: Date;
}
