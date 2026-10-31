import { MaterialIcons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorHomeSection } from "@/interfaces/supervisor";

interface SupervisorSectionCardProps {
  section: SupervisorHomeSection;
  enabled: boolean;
  badgeCount?: number;
  onPress?: () => void;
}

export default function SupervisorSectionCard({
  section,
  enabled,
  badgeCount = 0,
  onPress,
}: SupervisorSectionCardProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  const handlePress = () => {
    if (!enabled) {
      return;
    }
    if (onPress) {
      onPress();
      return;
    }
    router.push(section.route as Href);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!enabled}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor,
          opacity: enabled ? (pressed ? 0.92 : 1) : 0.55,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: enabled
                ? `${buttonColor}20`
                : `${iconMuted}15`,
            },
          ]}
        >
          <MaterialIcons
            name={enabled ? "chevron-right" : "lock-outline"}
            size={22}
            color={enabled ? buttonColor : iconMuted}
          />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.titleRow}>
            <StyledText variant="headline">{section.title}</StyledText>
            {enabled && badgeCount > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: `${errorColor}22` },
                ]}
              >
                <StyledText variant="caption" color={errorColor}>
                  {badgeCount > 99 ? "99+" : badgeCount}
                </StyledText>
              </View>
            ) : null}
          </View>
          <StyledText variant="body" color={iconMuted} style={styles.description}>
            {section.description}
          </StyledText>
        </View>
      </View>

      <View style={styles.footer}>
        {enabled ? (
          <StyledText variant="label" color={buttonColor}>
            Open
          </StyledText>
        ) : (
          <StyledText variant="caption" color={warningColor}>
            Coming in phase {section.phase}
          </StyledText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  cardTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    borderRadius: 999,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: "center",
  },
  description: {
    lineHeight: 21,
  },
  footer: {
    paddingTop: 2,
  },
});
