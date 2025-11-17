import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import ThemedView from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppButton from '@/components/ThemedButton';
import { loginWithEmail, googleLogin } from '@/utils/auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const gotoDashboard = () => router.replace('/profile');

  const handleEmailLogin = async () => {
    try {
      await loginWithEmail(email.trim(), password);
      gotoDashboard();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <ThemedView safe style={s.container}>
      <Ionicons name="person-circle-outline" size={64} color="black" />
      <Text style={s.title}>Sign in</Text>

      {/* --- e-mail / password form --- */}
      <TextInput
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={s.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={s.input}
      />
      <AppButton title="Sign in with e-mail" onPress={handleEmailLogin} />

      {/* --- Google button --- */}
      <AppButton title="Sign in with Google" onPress={googleLogin} />

      {/* --- link to sign-up --- */}
      <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
        <Text style={s.link}>Need an account? Sign up →</Text>
      </TouchableOpacity>

      {/* --- dev shortcut to home --- */}
      <TouchableOpacity onPress={() => router.push('/')}>
        <Ionicons name="home" size={24} color="black" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  input: { width: '80%', borderWidth: 1, borderRadius: 8, padding: 10 },
  link: { marginTop: 10, color: '#53C1DE' },
});
