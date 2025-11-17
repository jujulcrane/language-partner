import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Tabs, router } from 'expo-router';
import * as Updates from 'expo-updates';      // ← add
import { auth } from '@/utils/firebaseConfig';
import { signOut } from 'firebase/auth';

export default function TabsLayout() {
  /* helper */
  const handleLogout = async () => {
    try {
      await signOut(auth);                // clears Firebase session
      router.replace('/auth/sign-in');    // back to login screen
    } catch (e) {
      console.warn('Could not sign out', e);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { paddingTop: 10, height: 90 },

        /* ───── header buttons ───── */
        headerLeft: () => (
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({
              marginLeft: 16,
              opacity: pressed ? 0.5 : 1,
            })}
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={24} color="#FFC107" />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => ({
              marginRight: 16,
              opacity: pressed ? 0.5 : 1,
            })}
            accessibilityLabel="Go home"
          >
            <Ionicons name="home-outline" size={24} color="#FFC107" />
          </Pressable>
        ),
      }}
    >
      {/* your tabs */}
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
              name="teddy-bear"
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
    </Tabs>
  );
}
