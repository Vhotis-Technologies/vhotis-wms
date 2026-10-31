import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorInboundVarianceLine } from "@/interfaces/supervisor";
import { formatInboundReceiptLineStatus } from "@/utils/supervisorInbound";

interface InboundVarianceLineCardProps {
  line: SupervisorInboundVarianceLine;
  highlight?: boolean;
}

export default function InboundVarianceLineCard({
  line,
  highlight = false,
}: InboundVarianceLineCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");

  const accentColor = line.needsApproval
    ? errorColor
    : line.hasVariance
      ? warningColor
      : successColor;

  const declaredLabel =
    line.declaredQuantity != null
      ? `${line.receivedQuantity}/${line.declaredQuantity} received`
      : `${line.receivedQuantity} received`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: highlight ? `${accentColor}88` : borderColor,
          borderWidth: highlight ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="bodyMedium">{line.productName}</StyledText>
        <View
          style={[styles.statusBadge, { backgroundColor: `${accentColor}18` }]}
        >
          <StyledText variant="caption" color={accentColor}>
            {formatInboundReceiptLineStatus(line.status)}
          </StyledText>
        </View>
      </View>

      {line.sku ? (
        <StyledText variant="monoSmall" color={iconMuted}>
          {line.sku}
        </StyledText>
      ) : null}

      <StyledText variant="label" color={iconMuted}>
        {declaredLabel}
        {line.damagedQuantity > 0
          ? ` · ${line.damagedQuantity} damaged`
          : ""}
        {line.acceptedQuantity > 0
          ? ` · ${line.acceptedQuantity} accepted`
          : ""}
      </StyledText>

      {line.notes ? (
        <StyledText variant="caption" color={iconMuted} style={styles.notes}>
          {line.notes}
        </StyledText>
      ) : null}

      {line.needsApproval ? (
        <StyledText variant="caption" color={errorColor}>
          Needs supervisor approval
        </StyledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notes: {
    marginTop: 2,
    lineHeight: 18,
  },
});
