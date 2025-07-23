// components/TranslationBubble.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { translateText } from '@/app/api/api';

// swap this import if you pick a different provider

type Props = { source: string; };

const TranslationBubble: React.FC<Props> = ({ source }) => {
  const [english, setEnglish] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnglish(null);
  }, [source]);

  const onPress = async () => {
    // Toggle off if we already have the translation
    if (english) {
      setEnglish(null);
      return;
    }

    setLoading(true);
    try {
      const result = await translateText(source);
      setEnglish(result);
    } catch (err) {
      console.warn(err);
      Alert.alert('Sorry', 'Could not translate right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPress} disabled={loading}>
        <Ionicons name="language" size={24} color="#FFC107" />
      </TouchableOpacity>

      {loading && <ActivityIndicator style={{ marginLeft: 8 }} />}
      {english && (
        <ThemedText style={styles.bubble}>{english}</ThemedText>
      )}
    </View>
  );
};

export default TranslationBubble;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  bubble: {
    backgroundColor: '#FFF59D',
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
    flexShrink: 1,
    color: Colors.light.text,
  },
});
