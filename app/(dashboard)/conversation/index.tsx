import { Alert, StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ThemedView from '../../../components/ThemedView'
import ThemedText from '../../../components/ThemedText'
import { Audio } from 'expo-av'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons';


const ConversationHome = () => {

  const { bottom } = useSafeAreaInsets();
  const [recording, setRecording] = React.useState<Audio.Recording | undefined>(undefined);
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
      router.push(`/conversation/new-recording?uri=${encodeURIComponent(uri)}`);
    }
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedText title={true}>Conversation Home Page</ThemedText>
      <View style={[styles.buttonContainer, { bottom: bottom + 20 }]}>
        <TouchableOpacity onPress={recording ? stopRecording : startRecording} style={[
          styles.recordButton,
          recording ? styles.recordingButton : styles.notRecordingButton,
        ]}>
          <Ionicons name={recording ? 'stop-circle' : 'mic-circle'} size={24} color="white" />
        </TouchableOpacity>
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