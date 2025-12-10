import { IncomingMessage } from 'http';
import { admin } from '../firebaseAdmin';

/**
 * Authenticate WebSocket connection using Firebase ID token from query params
 *
 * React Native's built-in WebSocket doesn't support custom headers,
 * so we use query parameters for authentication during handshake.
 *
 * Expected URL format: ws://localhost:3000/ws/realtime?token=<firebase-token>&jlptLevel=N3&grammarPrompt=...
 *
 * @param req - Incoming HTTP request from WebSocket upgrade
 * @returns Object with uid and config if authenticated, null if authentication fails
 */
export const authenticateWebSocket = async (
  req: IncomingMessage
): Promise<{ uid: string; jlptLevel?: string; grammarPrompt?: string } | null> => {
  try {
    // Parse URL and query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('❌ [WS-AUTH] No token provided in query params');
      return null;
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract optional configuration from query params
    const jlptLevel = url.searchParams.get('jlptLevel') || undefined;
    const grammarPrompt = url.searchParams.get('grammarPrompt') || undefined;

    console.log('✅ [WS-AUTH] Authentication successful:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      jlptLevel,
      hasGrammarPrompt: !!grammarPrompt,
    });

    return {
      uid: decodedToken.uid,
      jlptLevel,
      grammarPrompt,
    };
  } catch (error) {
    console.error('❌ [WS-AUTH] Authentication failed:', error);

    if (error instanceof Error) {
      console.error('[WS-AUTH] Error details:', error.message);
    }

    return null;
  }
};

/**
 * Get user ID from WebSocket authentication result
 * Useful for ensuring user owns the resource they're accessing
 */
export const getUserId = (authResult: { uid: string } | null): string | null => {
  return authResult?.uid || null;
};
