import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel } from "@/app/components/shared/floorStyles";
import { DEFAULT_PACK_STATION_LABEL } from "@/constants/packer";
import { useThemeColor } from "@/hooks/useThemeColor";

interface PackJobHeaderProps {
  orderId: string;
  storeName: string;
  itemCount: number;
  boxHint: string;
  stationLabel?: string;
}

export default function PackJobHeader({
  orderId,
  storeName,
  itemCount,
  boxHint,
  stationLabel = DEFAULT_PACK_STATION_LABEL,
}: PackJobHeaderProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const buttonColor = useThemeColor({}, "button");
  const bandForeground = useThemeColor({}, "buttonText");
  const successColor = useThemeColor({}, "success");

  return (
    <View style={[styles.container, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.titleBand, { backgroundColor: buttonColor }]}>
        <StyledText variant="eyebrow" style={[styles.titleBandText, { color: bandForeground }]}>
          {stationLabel.toUpperCase()}
        </StyledText>
      </View>
      <View style={styles.body}>
        <StyledText variant="mono" color={successColor}>
          {orderId}
        </StyledText>
        <StyledText variant="display" style={styles.storeName}>
          {storeName}
        </StyledText>
        <StyledText variant="body" color={iconMuted}>
          {itemCount} items · {boxHint}
        </StyledText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginBottom: 12,
  },
  titleBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  titleBandText: {
    letterSpacing: 1.4,
  },
  body: {
    padding: 14,
    gap: 6,
  },
  storeName: {
    fontSize: 24,
  },
});
