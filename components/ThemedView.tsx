import { StyleProp, useColorScheme, View, ViewStyle } from 'react-native'
import React from 'react'
import { Colors } from '../constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ThemedViewProps {
  style?: StyleProp<ViewStyle>;
  safe?: boolean;
  [key: string]: any;
}

const ThemedView: React.FC<ThemedViewProps> = ({ style, safe = false, ...props }) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme!] ?? Colors.light;

  if (!safe) return (
    <View
      style={[{ backgroundColor: theme.background }, style]}
      {...props}
    />
  );

  return (
    <View
      style={[
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedView