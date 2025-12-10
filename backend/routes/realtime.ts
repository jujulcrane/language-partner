import WebSocket from 'ws';
import type {
  RealtimeEvent,
  RealtimeServerEvent,
  SessionConfig,
  RealtimeConnectionConfig,
  ResponseAudioTranscriptDeltaEvent,
  ResponseAudioTranscriptDoneEvent,
} from '../types/realtime';

/**
 * RealtimeSession manages a bidirectional WebSocket connection
 * between the client and OpenAI's Realtime API.
 *
 * Flow:
 * Client WS ←→ RealtimeSession ←→ OpenAI Realtime API
 */
export class RealtimeSession {
  private clientWs: WebSocket;
  private openaiWs: WebSocket | null = null;
  private config: RealtimeConnectionConfig;
  private sessionId: string;
  private conversationTranscript: string[] = [];
  private sessionStartTime: number;
  private isConnected: boolean = false;

  constructor(clientWs: WebSocket, config: RealtimeConnectionConfig) {
    this.clientWs = clientWs;
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();

    console.log(`✨ [REALTIME] Session created:`, {
      sessionId: this.sessionId,
      uid: config.userId,
      jlptLevel: config.jlptLevel,
      hasGrammarPrompt: !!config.grammarPrompt,
    });
  }

  /**
   * Connect to OpenAI Realtime API and configure session
   */
  async connect(): Promise<void> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      console.log('🔌 [REALTIME] Connecting to OpenAI Realtime API...');

      // Connect to OpenAI Realtime API
      this.openaiWs = new WebSocket(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'OpenAI-Beta': 'realtime=v1',
          },
        }
      );

      // Set up OpenAI WebSocket event handlers
      this.openaiWs.on('open', () => this.handleOpenAIConnected());
      this.openaiWs.on('message', (data) => this.handleOpenAIMessage(data));
      this.openaiWs.on('error', (error) => this.handleOpenAIError(error));
      this.openaiWs.on('close', (code, reason) => this.handleOpenAIClose(code, reason));

      // Set up client WebSocket event handlers
      this.clientWs.on('message', (data) => this.handleClientMessage(data));
      this.clientWs.on('close', () => this.handleClientClose());
      this.clientWs.on('error', (error) => this.handleClientError(error));
    } catch (error) {
      console.error('❌ [REALTIME] Failed to connect:', error);
      this.sendErrorToClient('Failed to connect to OpenAI Realtime API');
      this.disconnect();
    }
  }

  /**
   * Handle successful connection to OpenAI
   */
  private handleOpenAIConnected(): void {
    console.log('✅ [REALTIME] Connected to OpenAI Realtime API');
    this.isConnected = true;

    // Configure session with instructions and settings
    this.configureSession();
  }

  /**
   * Configure OpenAI session with JLPT level and grammar prompt
   */
  private configureSession(): void {
    const instructions = this.buildInstructions(
      this.config.jlptLevel,
      this.config.grammarPrompt
    );

    const sessionConfig: Partial<SessionConfig> = {
      modalities: ['text', 'audio'],
      instructions,
      voice: 'coral',
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1',
      },
      turn_detection: null, // Disable server VAD - using manual recording control
      temperature: 0.7,
    };

    this.sendToOpenAI({
      type: 'session.update',
      session: sessionConfig,
    });

    console.log('⚙️  [REALTIME] Session configured with instructions:', {
      instructionsPreview: instructions.substring(0, 100) + '...',
      jlptLevel: this.config.jlptLevel,
    });
  }

  /**
   * Build AI instructions based on JLPT level and grammar focus
   */
  private buildInstructions(jlptLevel?: string, grammarPrompt?: string): string {
    let instructions = 'You are Tanuki Chan (たぬきちゃん), a friendly Japanese language learning partner. ';
    instructions += 'Your goal is to help the user practice Japanese conversation naturally. ';
    instructions += 'Always respond in Japanese. ';
    instructions += 'Keep your responses brief and conversational (1-3 sentences). ';
    instructions += 'Be encouraging and patient. ';

    if (jlptLevel) {
      instructions += `Adjust your vocabulary and grammar to JLPT ${jlptLevel} level. `;
      switch (jlptLevel) {
        case 'N5':
          instructions +=
            'Use very simple, everyday vocabulary and basic grammar patterns. Speak slowly and clearly. ';
          break;
        case 'N4':
          instructions +=
            'Use simple vocabulary and basic to intermediate grammar. Use plain form and some polite form. ';
          break;
        case 'N3':
          instructions +=
            'Use everyday vocabulary and intermediate grammar patterns. Mix casual and polite forms naturally. ';
          break;
        case 'N2':
          instructions +=
            'Use standard vocabulary with some advanced expressions. Use various grammar patterns appropriate for daily conversation. ';
          break;
        case 'N1':
          instructions +=
            'Use advanced vocabulary and complex grammar patterns. Feel free to use idioms and nuanced expressions. ';
          break;
      }
    }

    if (grammarPrompt) {
      instructions += `Focus especially on practicing: "${grammarPrompt}". `;
      instructions += 'Try to naturally incorporate this grammar point in your responses. ';
    }

    instructions += 'If the user makes a mistake, gently correct it in your next response by using the correct form naturally. ';
    instructions +=
      'Do not provide explicit grammar explanations unless specifically asked - this is Fast Mode for quick conversation practice. ';

    return instructions;
  }

  /**
   * Handle message from OpenAI
   */
  private handleOpenAIMessage(data: WebSocket.Data): void {
    try {
      const event: RealtimeServerEvent = JSON.parse(data.toString());

      // Log important events
      if (event.type === 'session.created' || event.type === 'session.updated') {
        console.log(`📝 [REALTIME] ${event.type}`);
      } else if (event.type === 'input_audio_buffer.speech_started') {
        console.log('🎤 [REALTIME] User started speaking');
      } else if (event.type === 'input_audio_buffer.speech_stopped') {
        console.log('🛑 [REALTIME] User stopped speaking');
      } else if (event.type === 'response.audio_transcript.delta') {
        // Collect transcript for history
        const transcriptEvent = event as ResponseAudioTranscriptDeltaEvent;
        if (transcriptEvent.delta) {
          this.conversationTranscript.push(transcriptEvent.delta);
        }
      } else if (event.type === 'response.audio_transcript.done') {
        const doneEvent = event as ResponseAudioTranscriptDoneEvent;
        console.log('💬 [REALTIME] AI response:', doneEvent.transcript);
      } else if (event.type === 'error') {
        console.error('❌ [REALTIME] OpenAI error:', event.error);
      }

      // Forward event to client
      this.sendToClient(event);
    } catch (error) {
      console.error('❌ [REALTIME] Error parsing OpenAI message:', error);
    }
  }

  /**
   * Handle message from client
   */
  private handleClientMessage(data: WebSocket.Data): void {
    try {
      const event: RealtimeEvent = JSON.parse(data.toString());

      // Log important client events
      if (event.type === 'input_audio_buffer.append') {
        // Too verbose to log every audio chunk
      } else if (event.type === 'input_audio_buffer.commit') {
        console.log('✅ [REALTIME] Client committed audio buffer');
      } else {
        console.log(`📨 [REALTIME] Client event: ${event.type}`);
      }

      // Forward event to OpenAI
      this.sendToOpenAI(event);

      // When VAD is disabled, manually trigger response after commit
      if (event.type === 'input_audio_buffer.commit') {
        console.log('🎯 [REALTIME] Triggering response generation');
        this.sendToOpenAI({
          type: 'response.create',
        });
      }
    } catch (error) {
      console.error('❌ [REALTIME] Error parsing client message:', error);
      this.sendErrorToClient('Invalid message format');
    }
  }

  /**
   * Handle OpenAI WebSocket error
   */
  private handleOpenAIError(error: Error): void {
    console.error('❌ [REALTIME] OpenAI WebSocket error:', error);
    this.sendErrorToClient('OpenAI connection error');
  }

  /**
   * Handle OpenAI WebSocket close
   */
  private handleOpenAIClose(code: number, reason: Buffer): void {
    console.log(`🔌 [REALTIME] OpenAI connection closed:`, {
      code,
      reason: reason.toString(),
    });
    this.isConnected = false;

    // Close client connection
    if (this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.close(1000, 'OpenAI connection closed');
    }
  }

  /**
   * Handle client WebSocket close
   */
  private async handleClientClose(): Promise<void> {
    console.log('👋 [REALTIME] Client disconnected');

    // Save session summary to Firestore (would be implemented separately)
    await this.saveSessionSummary();

    // Close OpenAI connection
    this.disconnect();
  }

  /**
   * Handle client WebSocket error
   */
  private handleClientError(error: Error): void {
    console.error('❌ [REALTIME] Client WebSocket error:', error);
    this.disconnect();
  }

  /**
   * Send event to OpenAI
   */
  private sendToOpenAI(event: RealtimeEvent): void {
    if (this.openaiWs && this.openaiWs.readyState === WebSocket.OPEN) {
      this.openaiWs.send(JSON.stringify(event));
    } else {
      console.warn('⚠️  [REALTIME] Cannot send to OpenAI - connection not open');
    }
  }

  /**
   * Send event to client
   */
  private sendToClient(event: RealtimeServerEvent): void {
    if (this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.send(JSON.stringify(event));
    } else {
      console.warn('⚠️  [REALTIME] Cannot send to client - connection not open');
    }
  }

  /**
   * Send error message to client
   */
  private sendErrorToClient(message: string): void {
    this.sendToClient({
      type: 'error',
      error: {
        type: 'server_error',
        message,
      },
    });
  }

  /**
   * Generate conversation summary from transcript
   */
  private generateSummary(): string {
    const fullTranscript = this.conversationTranscript.join('');

    if (!fullTranscript || fullTranscript.length === 0) {
      return 'Fast mode conversation (no transcript available)';
    }

    // Simple summary: first 200 characters + sentence count
    const summary = fullTranscript.substring(0, 200);
    const sentenceCount = (fullTranscript.match(/[。！？]/g) || []).length;

    return `${summary}${fullTranscript.length > 200 ? '...' : ''} (${sentenceCount} sentences)`;
  }

  /**
   * Save session summary to Firestore
   * Note: This would typically call a separate API endpoint
   */
  private async saveSessionSummary(): Promise<void> {
    try {
      const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const summary = this.generateSummary();

      console.log('💾 [REALTIME] Session summary:', {
        sessionId: this.sessionId,
        userId: this.config.userId,
        duration,
        summaryPreview: summary.substring(0, 100),
      });

      // TODO: Call Firestore API endpoint to save summary
      // This would typically be done via HTTP POST to /api/users/:uid/sessions/summary
      // For now, just log it
    } catch (error) {
      console.error('❌ [REALTIME] Failed to save session summary:', error);
      // Non-blocking error - don't throw
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('🔌 [REALTIME] Disconnecting session:', this.sessionId);

    if (this.openaiWs) {
      this.openaiWs.removeAllListeners();
      if (this.openaiWs.readyState === WebSocket.OPEN) {
        this.openaiWs.close();
      }
      this.openaiWs = null;
    }

    this.clientWs.removeAllListeners();
    if (this.clientWs.readyState === WebSocket.OPEN) {
      this.clientWs.close();
    }

    this.isConnected = false;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get session info
   */
  getInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.config.userId,
      isConnected: this.isConnected,
      duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
    };
  }
}
