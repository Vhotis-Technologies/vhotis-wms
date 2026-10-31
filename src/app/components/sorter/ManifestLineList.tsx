import { StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { SorterSectionBand, SorterZoneTag } from "@/app/components/sorter/ui/SorterLayout";
import { flatButton, flatPanel, SORTER_ACCENT_WIDTH, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { ManifestLine, ReceiptLineSummary } from "@/interfaces/sorter";
import { formatQuantityVariance } from "@/utils/receiveLineValidation";

interface ManifestLineListProps {
  lines: ManifestLine[];
  receiptLines?: ReceiptLineSummary[];
  onReceive?: (line: ManifestLine) => void;
}

function findReceiptLine(
  manifestLine: ManifestLine,
  receiptLines: ReceiptLineSummary[] | undefined,
): ReceiptLineSummary | undefined {
  if (!receiptLines?.length) {
    return undefined;
  }
  if (manifestLine.receipt_line_id != null) {
    return receiptLines.find((line) => line.id === manifestLine.receipt_line_id);
  }
  return receiptLines.find((line) => line.product_id === manifestLine.product_id);
}

export default function ManifestLineList({
  lines,
  receiptLines,
  onReceive,
}: ManifestLineListProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  return (
    <View style={styles.container}>
      <SorterSectionBand title="EXPECTED FROM SELLER" />

      <View style={[styles.listFrame, flatPanel, { borderColor }]}>
        {lines.map((line, index) => {
          const received = line.receipt_line_id !== null;
          const receipt = findReceiptLine(line, receiptLines);
          const variance =
            receipt != null
              ? formatQuantityVariance(receipt.received_quantity, line.declared_quantity)
              : null;
          const catalogReady = Boolean(line.product_id);
          const canReceive = !received && onReceive && catalogReady;
          const stripeColor = received ? successColor : catalogReady ? borderColor : warningColor;

          return (
            <View
              key={line.id}
              style={[
                styles.row,
                index > 0 ? { borderTopWidth: SORTER_BORDER, borderTopColor: borderColor } : null,
                { backgroundColor: received ? `${successColor}08` : cardColor },
              ]}
            >
              <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <StyledText variant="bodyMedium" style={styles.productName}>
                    {line.declared_name}
                  </StyledText>
                  <SorterZoneTag zone={line.zone} />
                </View>
                <StyledText variant="caption" color={iconMuted}>
                  {line.declared_quantity} {line.declared_unit}
                  {line.declared_size ? ` · ${line.declared_size}` : ""}
                </StyledText>
                {line.declared_sku ? (
                  <StyledText variant="monoSmall" color={iconMuted}>
                    {line.declared_sku}
                  </StyledText>
                ) : null}
                {received && receipt ? (
                  <View style={styles.receiptSummary}>
                    <StyledText variant="caption" color={successColor}>
                      Received {receipt.received_quantity} · {receipt.accepted_quantity} accepted
                      {receipt.damaged_quantity > 0 ? ` · ${receipt.damaged_quantity} damaged` : ""}
                    </StyledText>
                    {variance ? (
                      <StyledText variant="caption" color={warningColor}>
                        {variance}
                      </StyledText>
                    ) : null}
                  </View>
                ) : null}
                {!received && !catalogReady && onReceive ? (
                  <StyledText variant="caption" color={warningColor}>
                    Catalog pending — receiving unavailable
                  </StyledText>
                ) : null}
              </View>
              <View style={[styles.actionCol, { borderLeftColor: borderColor }]}>
                {canReceive ? (
                  <StyledButton
                    title="Receive"
                    onPress={() => onReceive(line)}
                    variant="small"
                    buttonStyles={[flatButton, styles.receiveButton]}
                  />
                ) : received ? (
                  <StyledText variant="caption" color={successColor} style={styles.actionLabel}>
                    DONE
                  </StyledText>
                ) : !catalogReady && onReceive ? (
                  <StyledText variant="caption" color={errorColor} style={styles.actionLabel}>
                    HOLD
                  </StyledText>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listFrame: {
    overflow: "hidden",
    borderTopWidth: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  stripe: {
    width: SORTER_ACCENT_WIDTH,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  productName: {
    flexShrink: 1,
  },
  actionCol: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: SORTER_BORDER,
    paddingHorizontal: 8,
  },
  receiveButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 72,
  },
  actionLabel: {
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  receiptSummary: {
    gap: 2,
    marginTop: 4,
  },
});
