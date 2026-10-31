import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { BoxSpec } from "@/interfaces/packer";

interface BoxSpecificationGridProps {
  boxSpec: BoxSpec;
}

export default function BoxSpecificationGrid({ boxSpec }: BoxSpecificationGridProps) {
  const textColor = useThemeColor({}, "text");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const warningColor = useThemeColor({}, "warning");
  const bandForeground = useThemeColor({}, "background");
  const textBand = useThemeColor({}, "text");

  const tiles = [
    { label: "BOX SIZE", value: boxSpec.box_size, color: textColor },
    { label: "TOTAL WEIGHT", value: boxSpec.total_weight, color: textColor },
    { label: "COLD PACK", value: boxSpec.cold_pack, color: warningColor },
    { label: "SEAL TYPE", value: boxSpec.seal_type, color: textColor },
  ];

  return (
    <View style={[styles.container, flatPanel, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.band, { backgroundColor: textBand }]}>
        <StyledText variant="eyebrow" style={[styles.bandText, { color: bandForeground }]}>
          BOX SPECIFICATION
        </StyledText>
      </View>
      <View style={[styles.grid, { borderTopColor: borderColor }]}>
        {tiles.map((tile, index) => (
          <View
            key={tile.label}
            style={[
              styles.tile,
              index % 2 === 0 ? { borderRightWidth: FLOOR_BORDER, borderRightColor: borderColor } : null,
              index < 2 ? { borderBottomWidth: FLOOR_BORDER, borderBottomColor: borderColor } : null,
            ]}
          >
            <StyledText variant="micro" color={iconMuted}>
              {tile.label}
            </StyledText>
            <StyledText variant="title" color={tile.color} style={styles.tileValue}>
              {tile.value}
            </StyledText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginBottom: 16,
  },
  band: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bandText: {
    letterSpacing: 1.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: FLOOR_BORDER,
  },
  tile: {
    width: "50%",
    padding: 14,
    gap: 6,
  },
  tileValue: {
    fontFamily: "SpaceMonoRegular",
  },
});
