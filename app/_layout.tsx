import { Stack } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../components/Navbar';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#007AFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { flex: 1 },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="conversation/index" options={{ title: 'Conversation' }} />
        <Stack.Screen name="conversation/setup" options={{ title: 'Set Up Conversation' }} />
        <Stack.Screen name="history/index" options={{ title: 'History' }} />
        <Stack.Screen name="profile/index" options={{ title: 'Profile' }} />
        <Stack.Screen name="auth/sign-in" options={{ title: 'Sign In' }} />
        <Stack.Screen name="auth/sign-up" options={{ title: 'Sign Up' }} />
      </Stack>
      <Navbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
