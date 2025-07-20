import { ActivityIndicator, Alert, StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ThemedView from '../../../components/ThemedView'
import { Audio } from 'expo-av'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';
import Talk from '@/components/Talk'
import LevelGrammarSelector from '@/components/LevelGrammarSelector'
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '@/constants/consts';


const ConversationHome = () => {

  const { bottom } = useSafeAreaInsets();
  // States for selection

  const [jlptLevel, setJlptLevel] = React.useState('');
  const [grammarPrompt, setGrammarPrompt] = React.useState('');

  //chat logic states
  const [inputText, setInputText] = React.useState(''); //typed or transcribed

  const [recording, setRecording] = React.useState<Audio.Recording | undefined>(undefined);
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const router = useRouter();
  const startRecording = async () => {
    try {
      // Request permission to access the microphone
      const response = await Audio.requestPermissionsAsync();
      if (response.status !== 'granted') {
        console.error('Permission to access microphone was denied');
        Alert.alert('Permission Denied', 'You need to allow microphone access to record audio.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(recording);
    } catch (error) {
      console.error('Error starting recording:', error);
    } finally {
      // Function to start recording audio
      console.log("Recording started");
    }
  }

  const stopRecording = async () => {
    if (!recording) {
      console.warn('No recording in progress');
      return;
    }
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    setRecording(undefined);

    if (uri) {
      await handleTranscribe(uri);
    }
  };

  const handleTranscribe = async (uri: string) => {
    setIsTranscribing(true);
    try {
      // get file info for debugging
      const info = await FileSystem.getInfoAsync(uri);
      console.log('File info:', info);

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        Alert.alert('Transcription Error', data.error);
      } else {
        setInputText(data.text || 'No transcription available');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      Alert.alert('Transcription Error', 'Failed to transcribe audio!');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <LevelGrammarSelector
        selectedLevel={jlptLevel}
        setSelectedLevel={setJlptLevel}
        grammarPrompt={grammarPrompt}
        setGrammarPrompt={setGrammarPrompt}
      />
      <Talk
        inputText={inputText}
        setInputText={setInputText}
        //jlptLevel={jlptLevel}
        //grammarPrompt={grammarPrompt}
        disabled={isTranscribing}
      />
      {/* Mic button char bar */}
      <View style={[styles.buttonContainer, { bottom: bottom + 20 }]}>
        <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={[
          styles.recordButton,
          recording ? styles.recordingButton : styles.notRecordingButton,
        ]}
          disabled={isTranscribing}>
          <Ionicons name={recording ? 'stop-circle' : 'mic-circle'} size={24} color="white" />
        </TouchableOpacity>
        {isTranscribing && <ActivityIndicator style={{ marginLeft: 16 }} />}
      </View>
    </ThemedView >
  )
}

export default ConversationHome

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FFC107',
  },
  notRecordingButton: {
    backgroundColor: '#53C1DE',
  }
})