import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import ThemedView from '../../../components/ThemedView';
import ThemedText from '../../../components/ThemedText';

const Page = () => {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  console.log('URI:', uri);
  return (
    <ThemedView>
      <ThemedText>Page</ThemedText>
    </ThemedView>
  )
}

export default Page

const styles = StyleSheet.create({})