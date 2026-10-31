import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PackLabel } from "@/interfaces/packer";

interface LabelPreviewCardProps {
  label: PackLabel;
  orderId: string;
  showBarcode?: boolean;
}

function DetailRow({
  label,
  value,
  labelColor,
  valueColor,
  borderColor,
  isLast,
}: {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
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
      <StyledText variant="micro" color={labelColor}>
        {label}
      </StyledText>
      <StyledText variant="label" color={valueColor} style={styles.rowValue}>
        {value}
      </StyledText>
    </View>
  );
}

export default function LabelPreviewCard({
  label,
  orderId,
  showBarcode = true,
}: LabelPreviewCardProps) {
  const textColor = useThemeColor({}, "text");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const bandForeground = useThemeColor({}, "background");
  const textBand = useThemeColor({}, "text");

  return (
    <View style={[styles.card, flatPanel, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.headerBand, { backgroundColor: textBand }]}>
        <View style={styles.headerInner}>
          <View style={styles.logo}>
            <StyledText variant="title" color={bandForeground}>
              V
            </StyledText>
          </View>
          <View style={styles.headerText}>
            <StyledText variant="bodyMedium">Vhotis</StyledText>
            <StyledText variant="caption" color={iconMuted}>
              Community Commerce · Dublin
            </StyledText>
          </View>
          <View style={[styles.copyBadge, { borderColor }]}>
            <StyledText variant="micro" color={iconMuted}>
              LABEL COPY
            </StyledText>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <DetailRow
          label="ORDER"
          value={orderId}
          labelColor={iconMuted}
          valueColor={successColor}
          borderColor={borderColor}
        />
        <DetailRow
          label="DELIVER TO"
          value={`${label.deliver_to_name}, ${label.deliver_to_address}`}
          labelColor={iconMuted}
          valueColor={textColor}
          borderColor={borderColor}
        />
        <DetailRow
          label="ITEMS"
          value={label.items_summary}
          labelColor={iconMuted}
          valueColor={textColor}
          borderColor={borderColor}
        />
        <DetailRow
          label="PACKED BY"
          value={`${label.packed_by}${label.packed_at ? ` · ${label.packed_at}` : ""}`}
          labelColor={iconMuted}
          valueColor={textColor}
          borderColor={borderColor}
        />
        {label.special_notes ? (
          <DetailRow
            label="SPECIAL"
            value={label.special_notes}
            labelColor={iconMuted}
            valueColor={warningColor}
            borderColor={borderColor}
            isLast={!showBarcode}
          />
        ) : null}

        {showBarcode ? (
          <View style={[styles.barcodeArea, { borderTopColor: borderColor }]}>
            <View style={styles.barcodeLines}>
              {Array.from({ length: 24 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.barcodeLine,
                    {
                      backgroundColor: iconMuted,
                      width: index % 3 === 0 ? 3 : 1,
                    },
                  ]}
                />
              ))}
            </View>
            <StyledText variant="monoSmall" color={iconMuted} style={styles.barcodeText}>
              {label.label_code.replace(/-/g, " · ")}
            </StyledText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    marginBottom: 12,
  },
  headerBand: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  copyBadge: {
    borderWidth: FLOOR_BORDER,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  body: {
    paddingHorizontal: 14,
  },
  row: {
    gap: 2,
    paddingVertical: 10,
  },
  rowValue: {
    fontWeight: "600",
  },
  barcodeArea: {
    marginTop: 4,
    paddingTop: 14,
    paddingBottom: 14,
    borderTopWidth: FLOOR_BORDER,
    alignItems: "center",
    gap: 8,
  },
  barcodeLines: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    height: 48,
  },
  barcodeLine: {
    height: "100%",
  },
  barcodeText: {
    letterSpacing: 1,
  },
});
