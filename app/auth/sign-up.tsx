import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

const signup = () => {
  return (
    <ThemedView safe={true} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="person-circle-outline" size={64} color="black" />
      <Text>Sign UP</Text>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Ionicons name="home" size={24} color="black" />
      </TouchableOpacity>
    </ThemedView>
  )
}

export default signup

const styles = StyleSheet.create({})