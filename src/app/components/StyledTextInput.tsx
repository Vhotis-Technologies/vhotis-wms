import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface StyledTextInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

const StyledTextInput = ({
  label,
  containerStyle,
  inputStyle,
  ...rest
}: StyledTextInputProps) => {
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const iconMuted = useThemeColor({}, "icons");

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <StyledText variant="label" style={{ fontWeight: "600" }}>
          {label}
        </StyledText>
      ) : null}
      <TextInput
        placeholderTextColor={iconMuted}
        style={[
          styles.input,
          {
            color: textColor,
            borderColor,
            backgroundColor: cardColor,
          },
          inputStyle,
        ]}
        {...rest}
      />
    </View>
  );
};

export default StyledTextInput;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  input: {
    width: "100%",
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
