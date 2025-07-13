import { StyleSheet, StyleProp, useColorScheme, View, ViewStyle } from 'react-native'
import React from 'react'
import { Colors } from '../constants/Colors'

interface ThemedViewProps {
  style?: StyleProp<ViewStyle>;
  [key: string]: any;
}

const ThemedCard: React.FC<ThemedViewProps> = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme!] ?? Colors.light;

  return (
    <View
      style={[
        {
          backgroundColor: theme.uiBackground
        },
        styles.card, style,
      ]}
      {...props}
    />
  );
};

export default ThemedCard

const styles = StyleSheet.create({
  card: {
    borderRadius: 5,
    padding: 20
  }
})