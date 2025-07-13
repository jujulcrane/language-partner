import { StyleSheet, Text, View } from 'react-native'
import React from 'react';
import { router } from 'expo-router';
import AppButton from '../components/ThemedButton';

const Home = () => {
  return (
    <View>
      <AppButton
        title="Profile"
        onPress={() => router.push('/(dashboard)/profile')}
      />
      <AppButton
        title="Start Conversation"
        onPress={() => router.push('/conversation/setup')}
      />
      <AppButton
        title="View History"
        onPress={() => router.push('/(dashboard)/history')}
      />
      <AppButton
        title="Sign In"
        onPress={() => router.push('/auth/sign-in')}
      />
      <AppButton
        title="Sign Up"
        onPress={() => router.push('/auth/sign-up')}
      />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})