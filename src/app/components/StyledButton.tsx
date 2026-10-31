import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface StyledButtonProps extends Omit<TouchableOpacityProps, "onPress"> {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "small" | "medium" | "large" | "tonal" | "basket";
  buttonStyles?: StyleProp<ViewStyle>;
  textStyles?: StyleProp<TextStyle>;
}

export default function StyledButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "small",
  buttonStyles,
  textStyles,
  ...props
}: StyledButtonProps) {
  const buttonColor = useThemeColor({}, "button");
  const buttonTextColor = useThemeColor({}, "buttonText");
  const borderColor = useThemeColor({}, "borders");
  const textColor = useThemeColor({}, "text");

  const getPaddingForSize = (): number => {
    switch (variant) {
      case "small":
        return 5;
      case "medium":
        return 8;
      case "large":
        return 10;
      case "tonal":
        return 8;
      case "basket":
        return 10;
      default:
        return 14;
    }
  };

  const getFontSizeForSize = (): number => {
    switch (variant) {
      case "small":
        return 13;
      case "medium":
        return 15;
      case "large":
        return 17;
      case "tonal":
        return 14;
      case "basket":
        return 16;
      default:
        return 15;
    }
  };

  const isTonal = variant === "tonal";
  const labelColor = isTonal ? textColor : buttonTextColor;
  const indicatorColor = isTonal ? textColor : buttonTextColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          paddingVertical: getPaddingForSize(),
          paddingHorizontal: getPaddingForSize() + 8,
          borderRadius: variant === "basket" ? 50 : 25,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
          backgroundColor: isTonal ? "transparent" : buttonColor,
          borderWidth: isTonal ? 2 : 0,
          borderColor: borderColor,
        },
        buttonStyles,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <StyledText
          variant="button"
          color={labelColor}
          style={[{ fontSize: getFontSizeForSize() }, textStyles]}
        >
          {title}
        </StyledText>
      )}
    </TouchableOpacity>
  );
}
