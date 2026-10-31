import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
} from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type StyledTextVariant =
  | "display"
  | "headline"
  | "title"
  | "body"
  | "bodyMedium"
  | "label"
  | "caption"
  | "eyebrow"
  | "mono"
  | "monoSmall"
  | "micro"
  | "button"
  | "hero"
  | "stat";

interface StyledTextProps extends TextProps {
  children: React.ReactNode;
  variant?: StyledTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

const variantStyles = StyleSheet.create({
  display: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "RobotoMedium",
  },
  headline: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "RobotoMedium",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "RobotoMedium",
  },
  body: {
    fontSize: 15,
    fontFamily: "RobotoRegular",
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "RobotoMedium",
  },
  label: {
    fontSize: 14,
    fontFamily: "RobotoRegular",
  },
  caption: {
    fontSize: 13,
    fontFamily: "RobotoRegular",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: "RobotoRegular",
    textTransform: "uppercase",
  },
  mono: {
    fontSize: 14,
    fontFamily: "SpaceMonoRegular",
  },
  monoSmall: {
    fontSize: 12,
    fontFamily: "SpaceMonoRegular",
    letterSpacing: 0.5,
  },
  micro: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: "RobotoRegular",
    textTransform: "uppercase",
  },
  button: {
    fontWeight: "600",
    fontFamily: "RobotoMedium",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  hero: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "SpaceMonoBold",
    letterSpacing: 1,
  },
  stat: {
    fontSize: 40,
    fontWeight: "700",
    fontFamily: "SpaceMonoBold",
  },
});

function getColorFromStyle(style: StyleProp<TextStyle>): string | undefined {
  if (!style) return undefined;

  if (Array.isArray(style)) {
    for (const item of style) {
      const found = getColorFromStyle(item as StyleProp<TextStyle>);
      if (found) return found;
    }
    return undefined;
  }

  if (style && typeof style === "object" && "color" in style) {
    return style.color as string;
  }

  return undefined;
}

export default function StyledText({
  variant = "body",
  children,
  color,
  style,
  ...rest
}: StyledTextProps) {
  const textColor = useThemeColor({}, "text");
  const styleColor = getColorFromStyle(style);
  const finalColor = color ?? styleColor ?? textColor;

  return (
    <Text
      style={[variantStyles[variant], { color: finalColor }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
