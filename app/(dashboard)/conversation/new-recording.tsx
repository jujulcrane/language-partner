import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ThemedView from '../../../components/ThemedView';
import ThemedText from '../../../components/ThemedText';
import { toast } from 'sonner-native';
import * as FileSystem from 'expo-file-system';
import AppButton from '../../../components/ThemedButton';
import { API_BASE_URL } from '@/constants/consts';


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
    setIsLoading(true);
    try {
      // (optional) get file info for debugging
      const info = await FileSystem.getInfoAsync(uri!);
      console.log('File info:', info);

      const formData = new FormData();
      formData.append('file', {
        uri: uri!,
        name: 'audio.m4a',
        type: 'audio/m4a', // or 'audio/x-m4a'
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
        method: 'POST',
        body: formData,
        // DO NOT manually set headers!
      });

      const data = await response.json();
      setTranscription(data.text || (data.error ? data.error : 'No transcription available'));
    } catch (err) {
      console.error('Transcription error:', err);
      setTranscription('Failed to transcribe audio!');
    } finally {
      setIsLoading(false);
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