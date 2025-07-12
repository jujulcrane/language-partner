import { StyleSheet, Text, View } from 'react-native'
import React from 'react';
import { router } from 'expo-router';
import AppButton from '../components/AppButton';

const Home = () => {
  return (
    <View>
      <AppButton
        title="Start Conversation"
        onPress={() => router.push('/conversation/setup')}
      />
      <AppButton
        title="View History"
        onPress={() => router.push('/history')}
      />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({})