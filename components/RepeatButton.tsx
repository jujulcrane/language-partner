import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Colors } from '@/constants/Colors';
import { Audio, InterruptionModeIOS } from 'expo-av';

interface RepeatButtonProps {
  /** Text that will be spoken aloud */
  text: string | null;
  /** BCP-47 language tag, defaults to Japanese */
  language?: string;
  /** Icon colour */
  color?: string;
  /** Icon size */
  size?: number;
  /** Extra styles for the touchable wrapper */
  style?: StyleProp<ViewStyle>;
}

const RepeatButton: React.FC<RepeatButtonProps> = ({
  text,
  language = 'ja-JP',
  color = Colors.primary,
  size = 26,
  style,
}) => {
  if (!text) return null;          // Nothing to say, nothing to render

  const handlePress = async () => {

    try {
      // 1️⃣  make sure we are in PLAYBACK mode and routed to the speaker
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      });

      Speech.stop();                 // Interrupt anything that is currently speaking
      Speech.speak(text, {
        language,
        pitch: 1.0,
        rate: 1.0,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{ padding: 8 }, style]}
      accessibilityLabel="Repeat"
      accessibilityRole="button"
    >
      <Ionicons name="volume-high" size={size} color={color} />
    </TouchableOpacity>
  );
};

export default RepeatButton;
