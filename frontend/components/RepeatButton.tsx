import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Audio,
  InterruptionModeIOS,
  InterruptionModeAndroid,
} from 'expo-av';
import { Buffer } from 'buffer';
import { Colors } from '@/constants/Colors';
import { fetchTTS } from '@/app/api/api';   // helper → ArrayBuffer

interface RepeatButtonProps {
  text: string | null;
  voice?: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const RepeatButton: React.FC<RepeatButtonProps> = ({
  text,
  voice = 'alloy',
  color = Colors.primary,
  size = 26,
  style,
}) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  /* cleanup on unmount */
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const handlePress = async () => {
    if (!text) return;

    try {
      /* stop any previous playback */
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      /* Force speaker / media channel */
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,

        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      /* Fetch OpenAI TTS */
      const buf = await fetchTTS(text, voice);
      const base64 = Buffer.from(buf).toString('base64');
      const uri = `data:audio/mp3;base64,${base64}`;

      /* Create & play */
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1 },   // volume 1 = full
        (status) => {
          if (!status.isLoaded) {
            if ('error' in status && status.error)
              console.error('TTS playback error:', status.error);
            return;
          }
          if (status.didJustFinish) {
            sound.unloadAsync();
            soundRef.current = null;
          }
        }
      );

      soundRef.current = sound;
    } catch (err) {
      console.error('Error playing TTS:', err);
    }
  };

  if (!text) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{ padding: 8 }, style]}
      accessibilityRole="button"
      accessibilityLabel="Repeat"
      activeOpacity={0.7}
    >
      <Ionicons name="volume-high" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default RepeatButton;
