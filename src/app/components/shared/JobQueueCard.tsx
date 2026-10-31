import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { FloorStatusStripe } from "@/app/components/shared/FloorLayout";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";

interface JobQueueCardProps {
  orderId: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  priority?: boolean;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
}

export default function JobQueueCard({
  orderId,
  title,
  subtitle,
  onPress,
  priority = false,
  footerLeft,
  footerRight,
}: JobQueueCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  const stripeColor = priority ? warningColor : successColor;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, flatPanel, { backgroundColor: cardColor, borderColor }]}
    >
      <FloorStatusStripe color={stripeColor} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <StyledText variant="monoSmall" color={successColor}>
            {orderId}
          </StyledText>
          {priority ? (
            <StyledText variant="caption" color={warningColor} style={styles.priority}>
              PRIORITY
            </StyledText>
          ) : null}
        </View>
        <StyledText variant="headline">{title}</StyledText>
        <StyledText variant="label" color={iconMuted}>
          {subtitle}
        </StyledText>
        {footerLeft || footerRight ? (
          <View style={[styles.footer, { borderTopColor: borderColor }]}>
            <View style={styles.footerLeft}>{footerLeft}</View>
            {footerRight}
          </View>
        ) : null}
      </View>
      <View style={[styles.chevron, { borderLeftColor: borderColor }]}>
        <StyledText variant="label" color={iconMuted}>
          ›
        </StyledText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  priority: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: FLOOR_BORDER,
  },
  footerLeft: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  chevron: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: FLOOR_BORDER,
  },
});
