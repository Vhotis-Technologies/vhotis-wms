import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import {
  buildSupervisorHistoryHref,
  buildSupervisorSettingsHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function SupervisorQuickLinks() {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push(buildSupervisorHistoryHref() as Href)}
        style={[styles.linkCard, { backgroundColor: cardColor, borderColor }]}
      >
        <StyledText variant="bodyMedium">Resolved history</StyledText>
        <StyledText variant="caption" color={iconMuted}>
          Search past exception decisions
        </StyledText>
      </Pressable>
      <Pressable
        onPress={() => router.push(buildSupervisorSettingsHref() as Href)}
        style={[styles.linkCard, { backgroundColor: cardColor, borderColor }]}
      >
        <StyledText variant="bodyMedium" color={buttonColor}>
          Settings
        </StyledText>
        <StyledText variant="caption" color={iconMuted}>
          Alerts and today&apos;s stats
        </StyledText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  linkCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
});
