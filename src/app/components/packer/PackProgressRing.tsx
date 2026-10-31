import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";

interface PackProgressRingProps {
  current: number;
  total: number;
  label?: string;
}

export default function PackProgressRing({
  current,
  total,
  label = "Items packed",
}: PackProgressRingProps) {
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");

  const progress = total > 0 ? current / total : 0;

  return (
    <View style={[styles.container, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={styles.header}>
        <StyledText variant="eyebrow" color={iconMuted}>
          {label.toUpperCase()}
        </StyledText>
        <StyledText variant="monoSmall" color={successColor}>
          {current}/{total}
        </StyledText>
      </View>
      <StyledText variant="display" style={styles.count}>
        {current} of {total}
      </StyledText>
      <View style={[styles.track, { backgroundColor: borderColor }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: successColor,
              width: `${Math.min(progress * 100, 100)}%`,
            },
          ]}
        />
      </View>
      <StyledText variant="caption" color={textColor}>
        {Math.round(progress * 100)}% complete
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  count: {
    fontSize: 28,
    textAlign: "center",
  },
  track: {
    height: 8,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
