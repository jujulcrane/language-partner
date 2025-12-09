import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Talk from '@/components/Talk';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Buffer } from 'buffer';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '@/constants/consts';
import { addTurn, fetchTTS, startSession } from '@/app/api/api';
import { auth } from '@/utils/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

type ConversationManagerProps = {
  jlptLevel?: string;
  grammarPrompt?: string;
};

const ConversationManager = ({ jlptLevel = undefined, grammarPrompt = undefined }: ConversationManagerProps) => {

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUid(user?.uid ?? null));
    return unsub;
  }, []);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [mode, setMode] = useState<'text' | 'mic'>('text');
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [talkState, setTalkState] = useState<{
    partner: string | null;
    feedback: string | null;
  }>({ partner: null, feedback: null });

  // OPTIMIZATION: Track current audio mode to avoid redundant configuration calls
  const currentAudioModeRef = useRef<'playback' | 'recording' | null>(null);

  // OPTIMIZATION: Helper to switch audio mode only when needed
  const setAudioModeForPlayback = async () => {
    if (currentAudioModeRef.current === 'playback') return; // Already in playback mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    currentAudioModeRef.current = 'playback';
  };

  const setAudioModeForRecording = async () => {
    if (currentAudioModeRef.current === 'recording') return; // Already in recording mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    currentAudioModeRef.current = 'recording';
  };

  async function speakWithOpenAI(text: string) {
    /* stop whatever is already playing */
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    /* OPTIMIZATION: Only switch audio mode if not already in playback mode */
    await setAudioModeForPlayback();

    /* fetch & play OpenAI TTS */
    const buf = await fetchTTS(text);                   // ArrayBuffer
    const uri = `data:audio/mp3;base64,${Buffer.from(buf).toString('base64')}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    soundRef.current = sound;

    sound.setOnPlaybackStatusUpdate((st) => {
      if (st.isLoaded && st.didJustFinish) {
        sound.unloadAsync();
        soundRef.current = null;
      }
    });
  }


  // -- Handle recording logic --
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      /* OPTIMIZATION: Only switch audio mode if not already in recording mode */
      await setAudioModeForRecording();
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (e) { }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setLoading(true);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(undefined);
    if (uri) await handleTranscribe(uri);
    setLoading(false);
  };

  // -- Handle STT & auto-send to API
  const handleTranscribe = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);

      // Get auth token
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await response.json();
      const text = data.text || '';

      await sendSpeech(text);
    } catch (err) {
      console.warn(err);
    } finally {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (e) {
        console.warn('Failed to delete recording file:', e);
      }
    }
  };

  // Send input (called on mode text: button click; mode mic: after transcription)
  const sendSpeech = async (speech: string) => {
    if (!speech.trim()) return;

    if (!uid) {
      console.warn('User not signed in');
      return;                                   // or redirect to /auth/sign-in
    }

    setLoading(true);
    try {
      // Get auth token
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/generate-response`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ speech, jlptLevel, grammarPrompt }),
      });
      if (!res.ok) throw new Error('Server error');
      const json = await res.json();

      // OPTIMIZATION: Update UI and start TTS immediately (don't wait for Firestore)
      setTalkState({ partner: json.response, feedback: json.feedback });
      speakWithOpenAI(json.response); // speak the response immediately
      setInputText('');

      (async () => {
        try {
          let sid = sessionId;
          if (!sid) {
            sid = await startSession(uid, jlptLevel || '', grammarPrompt || '');
            if (!sid) {
              console.error('Failed to start session');
              return;
            }
            setSessionId(sid);
          }

          // Record turn in firestore
          await addTurn(uid, sid, {
            userText: speech,
            partnerReply: json.response,
            feedback: json.feedback,
            jlptLevel: jlptLevel || '',
            grammarPrompt: grammarPrompt || '',
          });
        } catch (err) {
          console.error('Background Firestore operation failed:', err);
        }
      })();
    } catch (e) { }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
        <TouchableOpacity onPress={() => setMode('text')} style={{
          backgroundColor: mode === 'text' ? '#53C1DE' : '#ccc',
          padding: 8, borderRadius: 6, marginRight: 10
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Text</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('mic')} style={{
          backgroundColor: mode === 'mic' ? '#53C1DE' : '#ccc',
          padding: 8, borderRadius: 6
        }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Mic</Text>
        </TouchableOpacity>
      </View>

      <Talk
        mode={mode}
        inputText={inputText}
        setInputText={setInputText}
        onSend={() => sendSpeech(inputText)}
        partner={talkState.partner}
        feedback={talkState.feedback}
        loading={loading}
        disabled={loading}
      />

      {/* Only show MIC controls if mode === 'mic' */}
      {(mode === 'mic') && (
        <View style={{ alignSelf: 'center', margin: 16 }}>
          <TouchableOpacity
            onPress={recording ? stopRecording : startRecording}
            style={{
              width: 70, height: 70, borderRadius: 35,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: recording ? '#FFC107' : '#53C1DE',
              opacity: loading ? 0.6 : 1
            }}
            disabled={loading}
          >
            <Ionicons name={recording ? 'stop-circle' : 'mic-circle'} size={44} color="white" />
          </TouchableOpacity>
          {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
        </View>
      )}
    </View>
  );
};

export default ConversationManager;
