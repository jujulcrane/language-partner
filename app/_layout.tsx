// app/_layout.tsx
import { Stack } from 'expo-router';
//import { useAuth } from '../hooks/useAuth'; // Optional: for auth-based redirection
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';

export default function RootLayout() {
  // Optional: redirect unauthenticated users to sign-in
  // Remove if you want open access
  // const { user } = useAuth();
  // const segments = useSegments();
  // useEffect(() => {
  //   if (!user && segments[1] !== 'auth') {
  //     router.replace('/auth/sign-in');
  //   }
  // }, [user, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#007AFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* Stack auto-includes all files in /app as screens */}
      {/* You can add <Stack.Screen> here to customize titles or options */}
      {/* Example: */}
      {/* <Stack.Screen name="index" options={{ title: 'Home' }} /> */}
      {/* <Stack.Screen name="auth/sign-in" options={{ title: 'Sign In' }} /> */}
    </Stack>
  );
}
