import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { InboundShipmentDetail } from "@/interfaces/sorter";
import {
  canCompleteReceiving,
  completionBlockerMessage,
  receivingProgress,
} from "@/utils/sorterCompletion";

interface ShipmentReceivingProgressProps {
  shipment: InboundShipmentDetail;
}

export default function ShipmentReceivingProgress({
  shipment,
}: ShipmentReceivingProgressProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const textColor = useThemeColor({}, "text");

  if (shipment.status !== "receiving") {
    return null;
  }

  const progress = receivingProgress(shipment);
  const blocker = completionBlockerMessage(shipment);
  const ready = canCompleteReceiving(shipment);
  const manifestPct =
    progress.manifestTotal > 0
      ? progress.manifestReceived / progress.manifestTotal
      : 0;
  const storedPct =
    progress.lineTotal > 0 ? progress.linesStored / progress.lineTotal : 0;

  return (
    <View style={[styles.card, flatPanel, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.band, { backgroundColor: successColor }]}>
        <StyledText variant="eyebrow" style={styles.bandText}>
          RECEIVING PROGRESS
        </StyledText>
      </View>

      <View style={styles.body}>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <StyledText variant="label" color={iconMuted}>
              Manifest lines received
            </StyledText>
            <StyledText variant="monoSmall" color={textColor}>
              {progress.manifestReceived}/{progress.manifestTotal}
            </StyledText>
          </View>
          <View style={[styles.track, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: successColor, width: `${manifestPct * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <StyledText variant="label" color={iconMuted}>
              Receipt lines stored
            </StyledText>
            <StyledText variant="monoSmall" color={textColor}>
              {progress.linesStored}/{progress.lineTotal}
            </StyledText>
          </View>
          <View style={[styles.track, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: successColor, width: `${storedPct * 100}%` },
              ]}
            />
          </View>
        </View>

        {ready ? (
          <View style={[styles.message, { borderColor: successColor }]}>
            <StyledText variant="label" color={successColor}>
              All lines stored — ready to complete receiving.
            </StyledText>
          </View>
        ) : blocker ? (
          <StyledText variant="caption" color={iconMuted}>
            {blocker}
          </StyledText>
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
  band: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bandText: {
    color: "#000000",
    letterSpacing: 1.2,
  },
  body: {
    padding: 14,
    gap: 14,
  },
  metric: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    height: 6,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
  message: {
    borderWidth: SORTER_BORDER,
    padding: 10,
  },
});
