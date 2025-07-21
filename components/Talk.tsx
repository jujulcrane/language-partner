import React, { useMemo, useEffect } from 'react';
import * as Speech from 'expo-speech';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import RepeatButton from './RepeatButton';

interface TalkProps {
  mode: 'text' | 'mic';
  inputText: string;
  setInputText: (t: string) => void;
  onSend: () => void;
  partner: string | null;
  feedback: string | null;
  loading?: boolean;
  disabled?: boolean;
}

const Talk: React.FC<TalkProps> = ({
  mode, inputText, setInputText, onSend, partner, feedback, loading = false, disabled = false
}) => {
  const scheme = useColorScheme() as 'light' | 'dark' | null;
  const theme = Colors[scheme ?? 'light'];
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (partner) {
      Speech.stop();
      Speech.speak(partner, { language: 'ja-JP', pitch: 1.0, rate: 1.0 });
    }
  }, [partner]);

  return (
    <ThemedView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding' })} >
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText title style={styles.header}>
            Talk to Your Language Partner
          </ThemedText>
          {partner && (
            <View>
              <ThemedText style={styles.label}>Partner:</ThemedText>
              <ThemedText style={styles.bubble}>{partner}</ThemedText>
              <RepeatButton text={partner} />
            </View>
          )}
          {feedback && (
            <View>
              <ThemedText style={styles.label}>Feedback:</ThemedText>
              <ThemedText style={styles.feedback}>{feedback}</ThemedText>
              <RepeatButton text={feedback} />
            </View>
          )}
          {/* Only show text input if mode === 'text' */}
          {(mode === 'text') && (
            <>
              <TextInput
                multiline
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={onSend}
                placeholder="Type Japanese here…"
                placeholderTextColor={theme.iconColor}
                style={styles.input}
                editable={!loading && !disabled}
              />
              {loading ? <ActivityIndicator style={{ marginVertical: 12 }} /> :
                <Button title="Send" onPress={onSend} color={Colors.primary} disabled={disabled} />
              }
            </>
          )}
          {/* If mode === 'mic', show nothing for input. The control is in parent. */}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};
export default Talk;
const createStyles = (theme: typeof Colors.light | typeof Colors.dark) => StyleSheet.create({
  root: { flex: 1, padding: 16, backgroundColor: theme.background },
  scroll: { flexGrow: 1 },
  header: { marginBottom: 16, color: theme.title },
  label: { marginTop: 12, fontWeight: '600', color: theme.text },
  bubble: {
    backgroundColor: theme.navBackground,
    padding: 8, borderRadius: 6, marginTop: 4, color: theme.text,
  },
  feedback: {
    backgroundColor: `${Colors.warning}33`, padding: 8, borderRadius: 6, marginTop: 4, color: theme.text,
  },
  input: {
    borderWidth: 1, borderColor: theme.iconColor,
    borderRadius: 6, padding: 8,
    minHeight: 48, marginTop: 16, marginBottom: 8, color: theme.text,
  },
});
