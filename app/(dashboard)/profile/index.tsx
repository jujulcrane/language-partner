import { StyleSheet, Text } from 'react-native'
import React from 'react'
import ThemedView from '../../../components/ThemedView'
import Spacer from '../../../components/Spacer'
import ThemedText from '../../../components/ThemedText'

const Profile = () => {
  return (
    <ThemedView style={styles.container} safe={true}>
      <Spacer />
      <ThemedText title={true}>Profile</ThemedText>
    </ThemedView>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})