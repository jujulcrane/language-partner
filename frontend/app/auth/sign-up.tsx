import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import ThemedView from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppButton from '@/components/ThemedButton';
import { registerWithEmail } from '@/utils/auth';              // adjust path

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const gotoDashboard = () => router.replace('/conversation/setup');

  const handleRegister = async () => {
    try {
      await registerWithEmail(email.trim(), password);
      gotoDashboard();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <ThemedView safe style={s.container}>
      <Ionicons name="person-circle-outline" size={64} color="black" />
      <Text style={s.title}>Create account</Text>

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
      <AppButton title="Sign up" onPress={handleRegister} />

      <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
        <Text style={s.link}>← Already have an account? Sign in</Text>
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
