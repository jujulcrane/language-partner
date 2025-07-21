import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, InterruptionModeIOS } from 'expo-av';
import { Buffer } from 'buffer';
import { Colors } from '@/constants/Colors';
import { fetchTTS } from '@/app/api/api';      // ← your helper

interface RepeatButtonProps {
  text: string | null;
  /** optional OpenAI voice id */
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

  // free the sound when the component disappears
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
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      /* speaker-only audio mode */
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });

      /* fetch TTS from your server */
      const arrayBuf = await fetchTTS(text, voice);      // helper returns ArrayBuffer
      const base64 = Buffer.from(arrayBuf).toString('base64');
      const uri = `data:audio/mp3;base64,${base64}`;

      /* create & play */
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) {
            if ('error' in status && status.error) console.error(status.error);
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

  if (!text) return null;          // nothing to say, render nothing

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{ padding: 8 }, style]}
      accessibilityRole="button"
      accessibilityLabel="Repeat"
    >
      <Ionicons name="volume-high" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default RepeatButton;
