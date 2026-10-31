import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { ReceiptLineDetail } from "@/interfaces/sorter";

interface TagLabelsPanelProps {
  line: ReceiptLineDetail;
  unitCodes: string[];
  containerCodes: string[];
}

export default function TagLabelsPanel({
  line,
  unitCodes,
  containerCodes,
}: TagLabelsPanelProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const textColor = useThemeColor({}, "text");

  const isBoxed = line.packaging_mode === "boxed";

  return (
    <View style={styles.container}>
      <View style={[styles.successBanner, flatPanel, { borderColor, backgroundColor: cardColor }]}>
        <View style={[styles.successBand, { backgroundColor: successColor }]}>
          <StyledText variant="eyebrow" style={styles.successBandText}>
            LABELS GENERATED
          </StyledText>
        </View>
        <View style={styles.successBody}>
          <StyledText variant="bodyMedium">
            {unitCodes.length} unit{unitCodes.length === 1 ? "" : "s"}
            {containerCodes.length > 0
              ? ` · ${containerCodes.length} carton${containerCodes.length === 1 ? "" : "s"}`
              : ""}
          </StyledText>
          <StyledText variant="caption" color={iconMuted}>
            Ready to scan after physical labels are applied.
          </StyledText>
        </View>
      </View>

      {isBoxed && line.storage_containers.length > 0 ? (
        <View style={[styles.codeList, flatPanel, { borderColor }]}>
          {line.storage_containers.map((container, index) => (
            <View
              key={container.container_code}
              style={[
                styles.codeRow,
                index > 0 ? { borderTopWidth: SORTER_BORDER, borderTopColor: borderColor } : null,
                { backgroundColor: cardColor },
              ]}
            >
              <View style={[styles.codeStripe, { backgroundColor: textColor }]} />
              <View style={styles.codeContent}>
                <StyledText variant="eyebrow" color={iconMuted}>
                  CARTON
                </StyledText>
                <StyledText variant="mono" color={successColor}>
                  {container.container_code}
                </StyledText>
                <StyledText variant="caption" color={iconMuted}>
                  {container.unit_codes.length} units inside
                </StyledText>
                <StyledText variant="monoSmall" color={iconMuted}>
                  {container.unit_codes.join(" · ")}
                </StyledText>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.codeList, flatPanel, { borderColor }]}>
          <View style={[styles.codeRow, { backgroundColor: cardColor }]}>
            <View style={[styles.codeStripe, { backgroundColor: textColor }]} />
            <View style={styles.codeContent}>
              <StyledText variant="eyebrow" color={iconMuted}>
                UNIT BARCODES
              </StyledText>
              {unitCodes.map((code) => (
                <StyledText key={code} variant="monoSmall" color={iconMuted}>
                  {code}
                </StyledText>
              ))}
            </View>
          </View>
        </View>
      )}

      <StyledText variant="caption" color={iconMuted}>
        Apply physical labels, then continue to verification.
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 8,
  },
  successBanner: {
    overflow: "hidden",
  },
  successBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successBandText: {
    color: "#000000",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  successBody: {
    padding: 14,
    gap: 4,
  },
  codeList: {
    overflow: "hidden",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  codeStripe: {
    width: 4,
  },
  codeContent: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
});
