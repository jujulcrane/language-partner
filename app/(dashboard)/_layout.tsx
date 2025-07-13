import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Pressable } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          paddingTop: 10,
          height: 90,
        },
        headerShown: true,
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => ({
              marginRight: 16,
              opacity: pressed ? 0.5 : 1,
            })}
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={24} color="#FFC107" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="conversation/setup"
        options={{
          title: 'Set Up',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              size={24}
              name={focused ? 'settings' : 'settings-outline'}
              color={focused ? '#FFC107' : '#888'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="conversation/index"
        options={{
          title: 'Conversation',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              size={24}
              name={'teddy-bear'}
              color={focused ? '#FFC107' : '#888'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <AntDesign
              size={24}
              name={focused ? 'clockcircle' : 'clockcircleo'}
              color={focused ? '#FFC107' : '#888'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons
              size={24}
              name={focused ? 'person' : 'person-outline'}
              color={focused ? '#FFC107' : '#888'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
