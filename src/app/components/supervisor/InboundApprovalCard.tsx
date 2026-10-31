import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { formatShipmentStatus } from "@/constants/sorter";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorInboundApprovalSummary } from "@/interfaces/supervisor";
import type { InboundShipmentStatus } from "@/interfaces/sorter";
import { inboundApprovalSubtitle } from "@/utils/supervisorInbound";

interface InboundApprovalCardProps {
  approval: SupervisorInboundApprovalSummary;
  onPress: () => void;
}

export default function InboundApprovalCard({
  approval,
  onPress,
}: InboundApprovalCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  const urgent = approval.pendingVarianceCount > 0;
  const statusColor =
    approval.status === "receiving"
      ? successColor
      : approval.status === "partial_received"
        ? errorColor
        : warningColor;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: urgent ? `${errorColor}88` : borderColor,
          borderWidth: urgent ? 1.5 : 1,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="monoSmall" color={successColor}>
          {approval.id}
        </StyledText>
        {urgent ? (
          <View
            style={[styles.waitBadge, { backgroundColor: `${errorColor}18` }]}
          >
            <StyledText variant="caption" color={errorColor}>
              {approval.pendingVarianceCount} pending
            </StyledText>
          </View>
        ) : approval.needsSignOff ? (
          <View
            style={[styles.waitBadge, { backgroundColor: `${warningColor}18` }]}
          >
            <StyledText variant="caption" color={warningColor}>
              Sign-off
            </StyledText>
          </View>
        ) : null}
      </View>

      <StyledText variant="headline" style={styles.title}>
        {approval.sellerStoreName}
      </StyledText>

      {approval.sellerName ? (
        <StyledText variant="bodyMedium" color={iconMuted}>
          {approval.sellerName}
        </StyledText>
      ) : null}

      <StyledText variant="label" color={iconMuted}>
        {inboundApprovalSubtitle(approval)}
      </StyledText>

      <View style={styles.footer}>
        <StyledText variant="caption" color={iconMuted}>
          {approval.manifestLineCount} manifest line
          {approval.manifestLineCount === 1 ? "" : "s"}
        </StyledText>
        <StyledText variant="caption" color={statusColor} style={styles.status}>
          {formatShipmentStatus(approval.status as InboundShipmentStatus)}
        </StyledText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  waitBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  title: {
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  status: {
    fontWeight: "600",
  },
});
