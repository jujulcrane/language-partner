import React, { useState } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import Talk from '@/components/Talk';
import { Audio } from 'expo-av';
import { Buffer } from 'buffer';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL, UUID } from '@/constants/consts';
import { addTurn, fetchTTS, startSession } from '@/app/api/api';

type ConversationManagerProps = {
  jlptLevel?: string;
  grammarPrompt?: string;
};

const ConversationManager = ({ jlptLevel = undefined, grammarPrompt = undefined }: ConversationManagerProps) => {

  const uid = UUID; //PLACE HOLDER FOR USER ID
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [mode, setMode] = useState<'text' | 'mic'>('text');
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const [talkState, setTalkState] = useState<{
    partner: string | null;
    feedback: string | null;
  }>({ partner: null, feedback: null });

  async function speakWithOpenAI(text: string) {
    const arrayBuf = await fetchTTS(text);

    // turn it into a data-URI so Expo can stream it from RAM
    const base64 = Buffer.from(arrayBuf).toString('base64');
    const uri = `data:audio/mp3;base64,${base64}`;

    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        if ('error' in status && status.error) {
          console.error(`Playback error: ${status.error}`);
        }
        return;
      }

      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  }

  // -- Handle recording logic --
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
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
      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, { method: 'POST', body: formData });
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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speech, jlptLevel, grammarPrompt }),
      });
      if (!res.ok) throw new Error('Server error');
      const json = await res.json();

      //ensure firestore session
      let sid = sessionId;
      if (!sid) {
        sid = await startSession(uid, jlptLevel || '', grammarPrompt || '');
        if (!sid) throw new Error('Failed to start session');
        setSessionId(sid);
      }

      //record turn in firestore
      await addTurn(uid, sid, {
        userText: speech,
        partnerReply: json.response,
        feedback: json.feedback,
        jlptLevel: jlptLevel || '',
        grammarPrompt: grammarPrompt || '',
      });

      setTalkState({ partner: json.response, feedback: json.feedback });
      speakWithOpenAI(json.response); // speak the response
      setInputText('');
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
