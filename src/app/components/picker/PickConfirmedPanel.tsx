import { StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { flatButton, flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickLine } from "@/interfaces/picker";

interface PickConfirmedPanelProps {
  line: PickLine;
  unitCode: string | null;
  progressDoneLabel: string;
  remainingCount: number;
  handoffReady?: boolean;
  onNext: () => void;
  loading?: boolean;
}

function DetailRow({
  label,
  value,
  accent,
  labelColor,
  valueColor,
  accentColor,
  borderColor,
  isLast,
}: {
  label: string;
  value: string;
  accent?: boolean;
  labelColor: string;
  valueColor: string;
  accentColor: string;
  borderColor: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !isLast ? { borderBottomWidth: FLOOR_BORDER, borderBottomColor: borderColor } : null,
      ]}
    >
      <StyledText variant="eyebrow" color={labelColor}>
        {label}
      </StyledText>
      <StyledText
        variant="label"
        color={accent ? accentColor : valueColor}
        style={styles.rowValue}
      >
        {value}
      </StyledText>
    </View>
  );
}

export default function PickConfirmedPanel({
  line,
  unitCode,
  progressDoneLabel,
  remainingCount,
  handoffReady = false,
  onNext,
  loading,
}: PickConfirmedPanelProps) {
  const iconMuted = useThemeColor({}, "icons");
  const textColor = useThemeColor({}, "text");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");

  return (
    <View style={styles.container}>
      <View style={[styles.panel, flatPanel, { borderColor, backgroundColor: cardColor }]}>
        <View style={[styles.band, { backgroundColor: successColor }]}>
          <StyledText variant="eyebrow" style={styles.bandText}>
            SCAN CONFIRMED
          </StyledText>
        </View>
        <View style={styles.successBody}>
          <StyledText variant="display" color={successColor}>
            Item picked
          </StyledText>
          <StyledText variant="body" color={iconMuted} style={styles.subtitle}>
            {handoffReady
              ? "All pick lines are complete. This order is now in the pack queue."
              : `${line.product_name} added to basket. ${remainingCount} item${
                  remainingCount === 1 ? "" : "s"
                } remaining.`}
          </StyledText>
        </View>
        <View style={[styles.details, { borderTopColor: borderColor }]}>
          <DetailRow
            label="ITEM"
            value={line.product_name}
            labelColor={iconMuted}
            valueColor={textColor}
            accentColor={successColor}
            borderColor={borderColor}
          />
          <DetailRow
            label="LOCATION"
            value={line.location_code}
            accent
            labelColor={iconMuted}
            valueColor={textColor}
            accentColor={successColor}
            borderColor={borderColor}
          />
          <DetailRow
            label="LABEL"
            value={unitCode ?? "—"}
            labelColor={iconMuted}
            valueColor={textColor}
            accentColor={successColor}
            borderColor={borderColor}
          />
          <DetailRow
            label="QTY PICKED"
            value={`${line.quantity_picked} of ${line.quantity_required}`}
            labelColor={iconMuted}
            valueColor={textColor}
            accentColor={successColor}
            borderColor={borderColor}
          />
          <DetailRow
            label="PROGRESS"
            value={progressDoneLabel}
            accent
            labelColor={iconMuted}
            valueColor={textColor}
            accentColor={successColor}
            borderColor={borderColor}
            isLast
          />
        </View>
      </View>

      <StyledButton
        title={handoffReady ? "Back to pick queue" : "Next item →"}
        onPress={onNext}
        variant="large"
        loading={loading}
        buttonStyles={[flatButton, styles.actionButton]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  panel: {
    overflow: "hidden",
  },
  band: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bandText: {
    color: "#000000",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  successBody: {
    padding: 14,
    gap: 8,
    alignItems: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  details: {
    borderTopWidth: FLOOR_BORDER,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowValue: {
    fontFamily: "SpaceMonoRegular",
    maxWidth: "58%",
    textAlign: "right",
  },
  actionButton: {
    paddingVertical: 16,
  },
});
