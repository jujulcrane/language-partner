import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ThemedView from '../../../components/ThemedView';
import ThemedText from '../../../components/ThemedText';
import { toast } from 'sonner-native';
import AppButton from '../../../components/ThemedButton';
import { API_BASE_URL } from '../../../constants/consts';


const Page = () => {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const router = useRouter();
  const [transcription, setTranscription] = React.useState<string>('');

  useEffect(() => {
    if (!uri) return;

    handleTranscribe();
  }, [uri]);

  const handleTranscribe = async () => {
    if (!uri) return;

    setIsLoading(true);
    toast.loading('Transcribing audio…');

    try {
      const formData = new FormData();
      formData.append('file', {
        uri,                       // keep the file:// prefix
        name: 'recording.m4a',
        type: 'audio/m4a',         // iOS: 'audio/m4a', Android: 'audio/x-m4a'
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
        method: 'POST',
        headers: {                 // let RN set the boundary for you
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const json = await response.json();
      setTranscription(json.text ?? '');
    } catch (err) {
      console.error('Transcribe failed', err);
      toast.error('Failed to transcribe');
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };


  console.log('URI:', uri);

  const handleSave = () => {
    console.log('Transcription saved:', transcription);
  };

  return (
    <ThemedView>
      <TextInput
        multiline
        value={transcription}
        onChangeText={setTranscription}
        placeholder="Transcription will appear here"
        editable={!isLoading} />
      <ThemedText>Page</ThemedText>
      <AppButton
        title="Save Transcription"
        onPress={handleSave}
      />
    </ThemedView>
  )
}

export default Page

const styles = StyleSheet.create({})