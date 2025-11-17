import React from 'react';
import { View, StyleProp, ViewStyle, DimensionValue } from 'react-native';

interface SpacerProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  [key: string]: any;
}

const Spacer: React.FC<SpacerProps> = ({ width = '100%', height = 40, style, ...props }) => {
  return (
    <View style={[{ width, height }, style]} {...props} />
  );
};

export default Spacer;
