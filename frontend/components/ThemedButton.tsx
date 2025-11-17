import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors } from "../constants/Colors";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme!] ?? Colors.light;

  const buttonBg = disabled
    ? "#b0b0b0"
    : Colors.primary;
  const textColor = disabled
    ? "#f0f0f0"
    : "#FFFFFF";
  const indicatorColor = Colors.warning;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: buttonBg },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    // backgroundColor handled inline for flexibility
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default AppButton;
