import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack>
        {/* Tabs as the root screen */}
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        {/* Stack-only screens (not in Tabs) */}
        <Stack.Screen
          name="conversation/new-recording"
          options={{ title: 'New Recording', presentation: 'modal' }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
