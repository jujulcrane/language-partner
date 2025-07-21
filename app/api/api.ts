import { API_BASE_URL } from "@/constants/consts";

// Returns the user's name (or throws if the request fails)
export const getName = async (uid: string): Promise<string> => {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${encodeURIComponent(uid)}/name`
  );

  if (!response.ok) {
    throw new Error(`Request failed – status ${response.status}`);
  }

  const { name } = (await response.json()) as { name: string | undefined };

  if (!name) {
    throw new Error('Name not found for this user');
  }

  return name;       
};


export const startSession = async (
  uid: string,
  jlptLevel: string,
  grammarPrompt: string
) => {
  const res = await fetch(`${API_BASE_URL}/api/users/${uid}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
) =>
  fetch(`${API_BASE_URL}/api/users/${uid}/sessions/${sessionId}/turns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(turn),
  });

export const getSessions = async (uid: string) => {
  const res = await fetch(`${API_BASE_URL}/api/users/${uid}/sessions`);
  return (await res.json()) as any[];
};

export const getTurns = async (uid: string, sessionId: string) => {
  const res = await fetch(
    `${API_BASE_URL}/api/users/${uid}/sessions/${sessionId}/turns`
  );
  return (await res.json()) as any[];
};
