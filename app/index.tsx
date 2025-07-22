import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import AppButton from '@/components/ThemedButton';

const Home = () => (
  <View style={styles.root}>
    {/* main CTA */}
    <Image
      source={require('../assets/TalkingTanuki.png')}
      style={styles.image}
      resizeMode="contain"
    />
    <AppButton
      title="Start Conversation"
      onPress={() => router.push('/conversation/setup')}
      style={styles.startBtn}
    />

    {/* auth links */}
    <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
      <Text style={styles.linkText}>Sign In</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
      <Text style={styles.linkText}>Sign Up</Text>
    </TouchableOpacity>
  </View>
);

export default Home;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  startBtn: {
    color: '#FFC107',
    width: '100%',
  },
  linkText: {
    marginTop: 12,
    fontSize: 16,
    color: '#53C1DE',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  image: {
    width: 220,
    height: 220,
    marginBottom: 40,
  },

});
