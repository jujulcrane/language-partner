/* Talk.tsx – chat with language partner */

import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
} from 'react-native';

import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { API_BASE_URL } from '@/constants/consts';

interface TalkProps {
  initialSpeech?: string;
}

const Talk: React.FC<TalkProps> = ({ initialSpeech = '' }) => {
  /* ─── state ─────────────────────────────────────────────── */
  const [speech, setSpeech] = useState(initialSpeech);
  const [partner, setPartner] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ─── theme ─────────────────────────────────────────────── */
  const scheme = useColorScheme() as 'light' | 'dark' | null;
  const theme = Colors[scheme ?? 'light'];
  const styles = useMemo(() => createStyles(theme), [theme]);

  /* ─── network call ──────────────────────────────────────── */
  const sendSpeech = async () => {
    if (!speech.trim()) return;

    try {
      setLoading(true);
      setPartner(null);
      setFeedback(null);

      const res = await fetch(`${API_BASE_URL}/api/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speech }),
      });
      if (!res.ok) throw new Error('Server error');

      const json = (await res.json()) as { response: string; feedback: string };
      setPartner(json.response);
      setFeedback(json.feedback);
      setSpeech('');
    } catch (e) {
      console.error(e);
      setPartner('⚠️  Failed to get reply');
    } finally {
      setLoading(false);
    }
  };

  /* ─── UI ────────────────────────────────────────────────── */
  return (
    <ThemedView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding' })}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText title style={styles.header}>
            Talk to Your Language Partner
          </ThemedText>

          {partner && (
            <>
              <ThemedText style={styles.label}>Partner:</ThemedText>
              <ThemedText style={styles.bubble}>{partner}</ThemedText>
            </>
          )}

          {feedback && (
            <>
              <ThemedText style={styles.label}>Feedback:</ThemedText>
              <ThemedText style={styles.feedback}>{feedback}</ThemedText>
            </>
          )}

          <TextInput
            multiline
            value={speech}
            onChangeText={setSpeech}
            placeholder="Type Japanese here…"
            placeholderTextColor={theme.iconColor}
            style={styles.input}
          />

          {loading ? (
            <ActivityIndicator style={{ marginVertical: 12 }} />
          ) : (
            <Button title="Send" onPress={sendSpeech} color={Colors.primary} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default Talk;

/* ───────────────────────────────────────────────────────────── */
/*  helper to build a StyleSheet from the current theme          */
/* ───────────────────────────────────────────────────────────── */
const createStyles = (theme: typeof Colors.light | typeof Colors.dark) =>
  StyleSheet.create({
    root: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.background,
    },
    scroll: { flexGrow: 1 },
    header: {
      marginBottom: 16,
      color: theme.title,
    },
    label: {
      marginTop: 12,
      fontWeight: '600',
      color: theme.text,
    },
    bubble: {
      backgroundColor: theme.navBackground, // light: #FFF, dark: #222
      padding: 8,
      borderRadius: 6,
      marginTop: 4,
      color: theme.text,
    },
    feedback: {
      backgroundColor: `${Colors.warning}33`, // 20 % opacity of warning yellow
      padding: 8,
      borderRadius: 6,
      marginTop: 4,
      color: theme.text,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.iconColor,
      borderRadius: 6,
      padding: 8,
      minHeight: 48,
      marginTop: 16,
      marginBottom: 8,
      color: theme.text,
    },
  });
