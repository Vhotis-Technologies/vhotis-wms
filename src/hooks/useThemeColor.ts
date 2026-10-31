/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { useThemeContext } from "@/context/ThemeProvider";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  try {
    const { currentTheme } = useThemeContext();
    const theme = currentTheme;
    const colorFromProps = props[theme];

    if (colorFromProps) {
      return colorFromProps;
    }

    return Colors[theme][colorName];
  } catch {
    const scheme = useColorScheme();
    const theme = scheme === "dark" ? "dark" : "light";
    const colorFromProps = props[theme];

    if (colorFromProps) {
      return colorFromProps;
    }

    return Colors[theme][colorName];
  }
}
