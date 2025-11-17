import React from 'react';
import {
  Text,
  StyleProp,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface ThemedTextProps {
  style?: StyleProp<TextStyle>;
  title?: boolean;
  [key: string]: any;
}

const ThemedText: React.FC<ThemedTextProps> = ({ style, title = false, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme!] ?? Colors.light;

  const textColor = title ? theme.title : theme.text;

  return (
    <Text
      style={[
        { color: textColor },
        style,
      ]}
      {...props}
    />
  );
};

export default ThemedText;
