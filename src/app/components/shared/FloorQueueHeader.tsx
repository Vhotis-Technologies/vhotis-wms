import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

interface FloorQueueHeaderProps {
  employeeName: string;
  badgeLabel: string;
  badgeVariant?: "accent" | "neutral";
  badgePrefix?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function FloorQueueHeader({
  employeeName,
  badgeLabel,
  badgeVariant = "accent",
  badgePrefix = "",
}: FloorQueueHeaderProps) {
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");

  const isAccent = badgeVariant === "accent";

  return (
    <View style={styles.container}>
      <StyledText variant="label" color={iconMuted}>
        {getGreeting()}
      </StyledText>
      <StyledText variant="display">{employeeName}</StyledText>
      <View
        style={[
          styles.badge,
          isAccent
            ? {
                backgroundColor: `${successColor}20`,
                borderColor: `${successColor}44`,
              }
            : {
                backgroundColor: cardColor,
                borderColor: borderColor,
              },
        ]}
      >
        {isAccent ? (
          <StyledText variant="caption" color={successColor}>
            •
          </StyledText>
        ) : null}
        <StyledText
          variant="caption"
          color={isAccent ? successColor : iconMuted}
        >
          {badgePrefix}
          {badgeLabel}
        </StyledText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    gap: 4,
  },
});
