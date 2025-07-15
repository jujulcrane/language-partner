import { StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ThemedView from '../../../components/ThemedView';
import ThemedText from '../../../components/ThemedText';
import { toast } from 'sonner-native';
import AppButton from '../../../components/ThemedButton';

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
    toast.loading('Transcribing audio...');

    try {
      const formData = new FormData();
      const audioData = {
        uri: uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      };
      formData.append('file', audioData as unknown as Blob);

      //double check url
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }).then((res) => res.json());
      console.log('Transcription response:', response);

      setTranscription(response.text);
    }
    catch (error) {
      console.error('Error transcribing audio:', error);
      toast.error('Failed to transcribe audio');
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