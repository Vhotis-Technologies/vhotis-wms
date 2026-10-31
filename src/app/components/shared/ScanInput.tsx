import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

interface ScanInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function ScanInput({
  value,
  onChangeText,
  onSubmit,
  autoFocus = true,
  placeholder = "Enter or scan barcode",
}: ScanInputProps) {
  const textColor = useThemeColor({}, "text");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={iconMuted}
        style={[
          styles.input,
          {
            backgroundColor: cardColor,
            borderColor: borderColor,
            color: textColor,
          },
        ]}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontFamily: "SpaceMonoRegular",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
