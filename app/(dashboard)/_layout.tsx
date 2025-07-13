import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          paddingTop: 10, height: 90
        }
      }}
    >
      <Tabs.Screen
        name="conversation/setup"
        options={{ title: 'Start' }}
      />
      <Tabs.Screen
        name="conversation/index"
        options={{ title: 'Conversation', tabBarLabel: 'Conversation' }}
      />
      <Tabs.Screen
        name="history/index"
        options={{ title: 'History', tabBarLabel: 'History' }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tabs>
  );
}
