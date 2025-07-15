import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

export default function RootLayout() {
  const router = useRouter();
  return (
    <GestureHandlerRootView style={styles.container}>
      <Toaster />
      <Stack>
        {/* Tabs as the root screen */}
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        {/* Stack-only screens (not in Tabs) */}
        <Stack.Screen
          name="(dashboard)/conversation/new-recording"
          options={{
            title: 'New Recording', presentation: 'modal',
            headerLeft: () => {
              return <Ionicons name="close" size={24} color="#FFC107" onPress={() => router.back()} />
            }
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
