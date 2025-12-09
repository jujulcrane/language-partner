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
    const startTime = performance.now();
    console.log('🔊 [TTS] Starting TTS for:', text.substring(0, 50) + '...');

    try {
      /* stop whatever is already playing */
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        console.log('🔊 [TTS] Stopped previous playback');
      }

      /* OPTIMIZATION: Only switch audio mode if not already in playback mode */
      const modeStart = performance.now();
      await setAudioModeForPlayback();
      console.log(`🔊 [TTS] Audio mode set in ${(performance.now() - modeStart).toFixed(0)}ms`);

      /* fetch & play OpenAI TTS */
      const fetchStart = performance.now();
      console.log('📤 [TTS] Fetching audio from TTS API...');
      const buf = await fetchTTS(text);
      console.log(`📥 [TTS] Audio received in ${(performance.now() - fetchStart).toFixed(0)}ms (${buf.byteLength} bytes)`);

      const encodeStart = performance.now();
      const uri = `data:audio/mp3;base64,${Buffer.from(buf).toString('base64')}`;
      console.log(`🔊 [TTS] Base64 encoded in ${(performance.now() - encodeStart).toFixed(0)}ms`);

      const playStart = performance.now();
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      console.log(`▶️ [TTS] Playback started in ${(performance.now() - playStart).toFixed(0)}ms`);
      console.log(`⏱️ [TTS] Total TTS pipeline: ${(performance.now() - startTime).toFixed(0)}ms`);

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.isLoaded && st.didJustFinish) {
          console.log('✅ [TTS] Playback finished');
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.error('❌ [TTS] Error:', err);
      alert(`TTS Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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
    const startTime = performance.now();
    console.log('🎤 [STT] Starting transcription...');

    try {
      const formData = new FormData();
      formData.append('file', { uri, name: 'audio.m4a', type: 'audio/m4a' } as any);

      // Get auth token
      const tokenStart = performance.now();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      console.log(`🔑 [STT] Auth token retrieved in ${(performance.now() - tokenStart).toFixed(0)}ms`);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fetchStart = performance.now();
      console.log('📤 [STT] Uploading audio to backend...');
      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
        method: 'POST',
        headers,
        body: formData
      });

      console.log(`📥 [STT] Response received in ${(performance.now() - fetchStart).toFixed(0)}ms, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [STT] Server error:', response.status, errorText);
        alert(`Speech-to-text failed: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      const text = data.text || '';

      console.log(`✅ [STT] Transcription complete in ${(performance.now() - startTime).toFixed(0)}ms`);
      console.log(`📝 [STT] Transcribed text: "${text}"`);

      if (!text.trim()) {
        console.warn('⚠️ [STT] Empty transcription received');
        alert('No speech detected. Please try again.');
        return;
      }

      await sendSpeech(text);
    } catch (err) {
      console.error('❌ [STT] Error:', err);
      alert(`Transcription error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (e) {
        console.warn('Failed to delete recording file:', e);
      }
    }
  };

  // Send input with STREAMING (called on mode text: button click; mode mic: after transcription)
  const sendSpeech = async (speech: string) => {
    if (!speech.trim()) return;

    if (!uid) {
      console.warn('⚠️ [SEND] User not signed in');
      alert('Please sign in to continue');
      return;
    }

    const startTime = performance.now();
    console.log('🌊 [SEND-STREAM] Starting STREAMING response generation...');
    console.log(`📝 [SEND-STREAM] User input: "${speech}"`);

    setLoading(true);
    let fullResponse = '';
    let fullFeedback = '';
    let firstSentenceReceived = false;

    try {
      // Get auth token
      const tokenStart = performance.now();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      console.log(`🔑 [SEND-STREAM] Auth token retrieved in ${(performance.now() - tokenStart).toFixed(0)}ms`);

      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fetchStart = performance.now();
      console.log('📤 [SEND-STREAM] Requesting STREAMING LLM response...');

      // Use optimized endpoint (streaming internally)
      const res = await fetch(`${API_BASE_URL}/api/generate-response`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ speech, jlptLevel, grammarPrompt }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [SEND-STREAM] Server error:', res.status, errorText);
        alert(`Response generation failed: ${res.status} - ${errorText}`);
        setLoading(false);
        return;
      }

      console.log(`📥 [SEND-OPTIMIZED] Response received in ${(performance.now() - fetchStart).toFixed(0)}ms`);

      // Parse JSON response
      const json: { response: string; feedback: string; firstSentence?: string } = await res.json();

      console.log(`✅ [SEND-OPTIMIZED] Response parsed: "${json.response?.substring(0, 50)}..."`);
      console.log(`📊 [SEND-OPTIMIZED] Feedback: "${json.feedback?.substring(0, 50)}..."`);

      // Always play the FULL response for TTS
      // (First sentence info is just for logging/metrics)
      if (json.firstSentence) {
        console.log(`🎯 [SEND-OPTIMIZED] First sentence detected: "${json.firstSentence}"`);
        console.log(`⚡ [SEND-OPTIMIZED] Backend detected first sentence early (faster generation)`);
      }

      const ttsStart = performance.now();
      speakWithOpenAI(json.response); // Play FULL response
      console.log(`🔊 [SEND-OPTIMIZED] TTS started at ${(ttsStart - startTime).toFixed(0)}ms`);

      // Update UI with complete response
      fullResponse = json.response;
      fullFeedback = json.feedback;
      setTalkState({ partner: fullResponse, feedback: fullFeedback });
      console.log(`⏱️ [SEND-OPTIMIZED] Total time: ${(performance.now() - startTime).toFixed(0)}ms`);

      setInputText('');

      // Background Firestore operations
      (async () => {
        const firestoreStart = performance.now();
        console.log('💾 [FIRESTORE] Background save started...');
        try {
          let sid = sessionId;
          if (!sid) {
            console.log('💾 [FIRESTORE] Creating new session...');
            sid = await startSession(uid, jlptLevel || '', grammarPrompt || '');
            if (!sid) {
              console.error('❌ [FIRESTORE] Failed to start session');
              return;
            }
            setSessionId(sid);
            console.log(`✅ [FIRESTORE] Session created: ${sid}`);
          }

          // Record turn in firestore
          await addTurn(uid, sid, {
            userText: speech,
            partnerReply: fullResponse,
            feedback: fullFeedback,
            jlptLevel: jlptLevel || '',
            grammarPrompt: grammarPrompt || '',
          });
          console.log(`✅ [FIRESTORE] Turn saved in ${(performance.now() - firestoreStart).toFixed(0)}ms`);
        } catch (err) {
          console.error('❌ [FIRESTORE] Background operation failed:', err);
        }
      })();

    } catch (e) {
      console.error('❌ [SEND-STREAM] Unexpected error:', e);
      alert(`Error: ${e instanceof Error ? e.message : 'Unknown error occurred'}`);
    }
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
