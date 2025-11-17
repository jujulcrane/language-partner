import { API_BASE_URL } from "@/constants/consts";
import { auth } from "@/utils/firebaseConfig";

/**
 * Get the current user's Firebase ID token for authentication
 * Returns null if no user is signed in
 */
const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Create headers with optional authentication
 */
const createHeaders = async (includeAuth: boolean = true): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Returns the user's name (or throws if the request fails)
export const getName = async (uid: string): Promise<string | ''> => {
  const headers = await createHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/users/${encodeURIComponent(uid)}/name`,
    { headers }
  );

  if (!res.ok) {
    // Prefer returning '' so the caller can decide what to do
    console.warn(`getName → ${res.status}`);
    return '';
  }

  const { name } = (await res.json()) as { name?: string };
  return name ?? '';
};

export const apiSetName = async (uid: string, name: string): Promise<void> => {
  const headers = await createHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/users/${encodeURIComponent(uid)}/name`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name }),
    }
  );

  if (!res.ok) {
    const msg = `setName failed – status ${res.status}`;
    console.error(msg);
    throw new Error(msg);
  }
};


export const startSession = async (
  uid: string,
  jlptLevel: string,
  grammarPrompt: string
) => {
  const headers = await createHeaders();
  const res = await fetch(`${API_BASE_URL}/api/users/${uid}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jlptLevel, grammarPrompt }),
  });
  const json = await res.json();
  return json.sessionId as string;
};

export const addTurn = async (
  uid: string,
  sessionId: string,
  turn: {
    userText: string;
    partnerReply: string;
    feedback: string;
    jlptLevel: string;
    grammarPrompt: string;
  }
) => {
  const headers = await createHeaders();
  return fetch(`${API_BASE_URL}/api/users/${uid}/sessions/${sessionId}/turns`, {
    method: "POST",
    headers,
    body: JSON.stringify(turn),
  });
};

export const getSessions = async (uid: string) => {
  const headers = await createHeaders();
  const res = await fetch(`${API_BASE_URL}/api/users/${uid}/sessions`, {
    headers,
  });
  return (await res.json()) as any[];
};

export const getTurns = async (uid: string, sessionId: string) => {
  const headers = await createHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/users/${uid}/sessions/${sessionId}/turns`,
    { headers }
  );
  return (await res.json()) as any[];
};

export const deleteSession = async (uid: string, sessionId: string) => {
  const headers = await createHeaders();
  await fetch(`${API_BASE_URL}/api/users/${uid}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  });
};

export const fetchTTS = async (
  sentence: string,
  voice: string = 'coral',      // ← default
  format: 'mp3' | 'wav' | 'ogg' = 'mp3'
) => {
  const headers = await createHeaders(false); // TTS uses optional auth
  const res = await fetch(`${API_BASE_URL}/api/text-to-speech`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: sentence, voice, format }),
  });

  if (!res.ok) {
    throw new Error(`TTS request failed: ${res.status}`);
  }
  return res.arrayBuffer();
};

export async function translateText(text: string) {
  const headers = await createHeaders(false); // Translation uses optional auth
  const res = await fetch(`${API_BASE_URL}/api/translate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),   // ja -> en by default
  });
  if (!res.ok) throw new Error('Translation request failed');
  const { translation } = await res.json();
  return translation as string;
}



