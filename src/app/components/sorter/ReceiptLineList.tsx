import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { SorterSectionBand, SorterZoneTag } from "@/app/components/sorter/ui/SorterLayout";
import { flatPanel, SORTER_ACCENT_WIDTH, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { ReceiptLineSummary } from "@/interfaces/sorter";

interface ReceiptLineListProps {
  lines: ReceiptLineSummary[];
  onPressLine?: (line: ReceiptLineSummary) => void;
}

function stageLabel(stage: ReceiptLineSummary["stage"]) {
  switch (stage) {
    case "awaiting_tag":
      return "TAG";
    case "awaiting_verify":
      return "VERIFY";
    case "awaiting_putaway":
      return "PUTAWAY";
    case "stored":
      return "STORED";
    default:
      return String(stage).toUpperCase();
  }
}

export default function ReceiptLineList({ lines, onPressLine }: ReceiptLineListProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const buttonColor = useThemeColor({}, "button");

  return (
    <View style={styles.container}>
      <SorterSectionBand title="RECEIVED LINES" />

      {lines.length === 0 ? (
        <View style={[styles.empty, flatPanel, { borderColor, backgroundColor: cardColor }]}>
          <StyledText variant="label" color={iconMuted}>
            No receipt lines yet. Receive items from the manifest above.
          </StyledText>
        </View>
      ) : (
        <View style={[styles.listFrame, flatPanel, { borderColor }]}>
          {lines.map((line, index) => {
            const done = line.stage === "stored";
            const stageColor =
              line.stage === "awaiting_tag"
                ? warningColor
                : line.stage === "stored"
                  ? successColor
                  : buttonColor;

            return (
              <Pressable
                key={line.id}
                onPress={() => onPressLine?.(line)}
                style={[
                  styles.row,
                  index > 0 ? { borderTopWidth: SORTER_BORDER, borderTopColor: borderColor } : null,
                  { backgroundColor: done ? `${successColor}08` : cardColor },
                ]}
              >
                <View style={[styles.stripe, { backgroundColor: stageColor }]} />
                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <StyledText variant="bodyMedium">{line.product_name}</StyledText>
                    <SorterZoneTag zone={line.zone} />
                  </View>
                  <StyledText variant="caption" color={iconMuted}>
                    {line.units_stored} / {line.accepted_quantity} stored ·{" "}
                    {line.packaging_mode === "boxed"
                      ? `${line.container_count} cartons`
                      : "loose units"}
                    {line.stage === "awaiting_putaway" &&
                    line.units_stored < line.accepted_quantity
                      ? ` · ${line.accepted_quantity - line.units_stored} left`
                      : ""}
                  </StyledText>
                </View>
                <View style={[styles.stageCol, { borderLeftColor: borderColor }]}>
                  <StyledText variant="caption" color={stageColor} style={styles.stage}>
                    {stageLabel(line.stage)}
                  </StyledText>
                  <StyledText variant="caption" color={iconMuted}>
                    ›
                  </StyledText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  empty: {
    padding: 14,
    marginTop: 0,
  },
  listFrame: {
    overflow: "hidden",
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
  stageCol: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderLeftWidth: SORTER_BORDER,
    paddingHorizontal: 6,
  },
  stage: {
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
