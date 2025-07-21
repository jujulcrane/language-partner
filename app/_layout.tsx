// app/_layout.tsx   (or whatever your outer-most layout file is)
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Toaster } from 'sonner-native';
import { Audio, InterruptionModeIOS } from 'expo-av';

export default function RootLayout() {
  /* configure audio once when the app starts */
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playThroughEarpieceAndroid: false,
    }).catch(console.warn);
  }, []);

  return (

    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="(dashboard)" />
      <Stack.Screen
        name="(dashboard)/conversation/new-recording"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
