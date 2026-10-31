import { StyleSheet, View } from "react-native";

import ZoneBadge from "@/app/components/shared/ZoneBadge";
import StyledText from "@/app/components/StyledText";
import { FloorItemPanel } from "@/app/components/shared/FloorLayout";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PackLine } from "@/interfaces/packer";
import { getNextUnverifiedUnitCode } from "@/utils/packScan";

interface PackActiveLineCardProps {
  line: PackLine;
}

export default function PackActiveLineCard({ line }: PackActiveLineCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const successColor = useThemeColor({}, "success");

  const nextUnit = getNextUnverifiedUnitCode(line);

  return (
    <View style={styles.wrap}>
      <FloorItemPanel
        productName={line.product_name}
        sku={line.location_code || "No location"}
        sectionLabel="VERIFY THIS ITEM"
      />
      <View style={[styles.meta, flatPanel, { borderColor, backgroundColor: cardColor }]}>
        <ZoneBadge zone={line.zone} />
        <StyledText variant="caption" color={iconMuted}>
          {line.quantity_verified}/{line.quantity_required} units on line
        </StyledText>
      </View>
      {nextUnit ? (
        <View
          style={[
            styles.nextUnit,
            flatPanel,
            { backgroundColor: `${successColor}10`, borderColor: successColor },
          ]}
        >
          <StyledText variant="eyebrow" color={iconMuted}>
            NEXT UNIT
          </StyledText>
          <StyledText variant="monoSmall" color={successColor}>
            {nextUnit}
          </StyledText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    flexWrap: "wrap",
  },
  nextUnit: {
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
});
