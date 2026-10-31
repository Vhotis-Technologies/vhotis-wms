import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { FloorSectionBand } from "@/app/components/shared/FloorLayout";
import { flatPanel, FLOOR_ACCENT_WIDTH, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PackLine } from "@/interfaces/packer";
import { getNextUnverifiedUnitCode } from "@/utils/packScan";

interface PackItemListProps {
  lines: PackLine[];
}

export default function PackItemList({ lines }: PackItemListProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const buttonColor = useThemeColor({}, "button");

  return (
    <View style={styles.container}>
      <FloorSectionBand title="ITEMS TO PACK" />
      <View style={[styles.listFrame, flatPanel, { borderColor }]}>
        {lines.map((line, index) => {
          const verified = line.status === "verified";
          const isActive = line.status === "active";
          const nextUnit = isActive ? getNextUnverifiedUnitCode(line) : null;
          const stripeColor = verified ? successColor : isActive ? buttonColor : borderColor;
          const progressLabel =
            line.quantity_required > 0
              ? `${line.quantity_verified}/${line.quantity_required} verified`
              : null;

          return (
            <View
              key={line.id}
              style={[
                styles.row,
                index > 0 ? { borderTopWidth: FLOOR_BORDER, borderTopColor: borderColor } : null,
                { backgroundColor: verified ? `${successColor}08` : cardColor },
              ]}
            >
              <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
              <View style={styles.content}>
                <StyledText
                  variant="bodyMedium"
                  color={verified ? iconMuted : undefined}
                  style={{
                    textDecorationLine: verified ? "line-through" : "none",
                  }}
                >
                  {line.product_name}
                </StyledText>
                <StyledText variant="monoSmall" color={iconMuted}>
                  {line.location_code}
                  {nextUnit ? ` · Next ${nextUnit}` : ""}
                </StyledText>
                {progressLabel ? (
                  <StyledText variant="caption" color={isActive ? successColor : iconMuted}>
                    {progressLabel}
                  </StyledText>
                ) : null}
              </View>
              <View style={[styles.qtyCol, { borderLeftColor: borderColor }]}>
                <StyledText
                  variant="bodyMedium"
                  color={verified ? successColor : undefined}
                  style={{ fontWeight: isActive ? "700" : "400" }}
                >
                  ×{line.quantity_required}
                </StyledText>
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
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  stripe: {
    width: FLOOR_ACCENT_WIDTH,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  qtyCol: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: FLOOR_BORDER,
    paddingHorizontal: 6,
  },
});
