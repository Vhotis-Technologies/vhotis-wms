import { StyleSheet, View } from "react-native";

import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import { flatButton, flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickJobDetail } from "@/interfaces/picker";
import { getPickHandoffMessage, isPickJobFullyPicked } from "@/utils/pickerJob";

interface PickHandoffBannerProps {
  job: PickJobDetail;
  onBackToQueue: () => void;
  onOpenPackStation?: () => void;
}

export default function PickHandoffBanner({
  job,
  onBackToQueue,
  onOpenPackStation,
}: PickHandoffBannerProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const textColor = useThemeColor({}, "text");
  const fullyPicked = isPickJobFullyPicked(job);

  return (
    <View style={[styles.banner, flatPanel, { backgroundColor: cardColor, borderColor: successColor }]}>
      <View style={[styles.band, { backgroundColor: successColor }]}>
        <StyledText variant="eyebrow" style={styles.bandText}>
          {fullyPicked ? "PICK COMPLETE" : "READY FOR PACK"}
        </StyledText>
      </View>
      <View style={styles.body}>
        <StyledText variant="body" color={iconMuted}>
          {getPickHandoffMessage(job)}
        </StyledText>
        <StyledText variant="caption" color={iconMuted}>
          This order has left the pick queue and is waiting at the pack station.
        </StyledText>
        <StyledButton
          title="Back to pick queue"
          onPress={onBackToQueue}
          variant="large"
          buttonStyles={[flatButton, styles.primaryButton]}
        />
        {onOpenPackStation ? (
          <StyledButton
            title="Open pack station"
            onPress={onOpenPackStation}
            variant="tonal"
            buttonStyles={[
              flatButton,
              styles.secondaryButton,
              { borderColor, backgroundColor: cardColor, borderWidth: FLOOR_BORDER },
            ]}
            textStyles={{ color: textColor }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    overflow: "hidden",
    marginBottom: 12,
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
  body: {
    padding: 14,
    gap: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
});
