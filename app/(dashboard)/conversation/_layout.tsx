import { Stack } from "expo-router"
import React from "react"

export default function RootLayout() {
  return (
    <Stack >
      <Stack.Screen name="conversation/index" options={{ title: 'Conversation' }} />
      <Stack.Screen
        name="conversation/new-recording"
        options={{
          title: 'New Recording', presentation: 'modal'
        }
        } />
      <Stack.Screen name="history/index" options={{ title: 'History' }} />
      <Stack.Screen name="conversation/setup" options={{ title: 'Set Up' }} />
    </Stack>
  );
}