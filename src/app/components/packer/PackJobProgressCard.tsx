import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { formatPackJobStatus } from "@/constants/packer";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PackJobDetail } from "@/interfaces/packer";
import {
  isPackJobReadyForDispatch,
  isPackVerificationComplete,
  packJobProgress,
} from "@/utils/packJob";

interface PackJobProgressCardProps {
  job: PackJobDetail;
}

export default function PackJobProgressCard({ job }: PackJobProgressCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const buttonColor = useThemeColor({}, "button");
  const textColor = useThemeColor({}, "text");

  const progress = packJobProgress(job);
  const verificationComplete = isPackVerificationComplete(job);
  const readyForDispatch = isPackJobReadyForDispatch(job);
  const unitsPct =
    progress.unitsRequired > 0 ? progress.unitsVerified / progress.unitsRequired : 0;
  const linesPct =
    progress.totalLines > 0 ? progress.linesVerified / progress.totalLines : 0;

  return (
    <View style={[styles.card, flatPanel, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.band, { backgroundColor: buttonColor }]}>
        <StyledText variant="eyebrow" style={styles.bandText}>
          PACK PROGRESS
        </StyledText>
      </View>
      <View style={styles.body}>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <StyledText variant="label" color={iconMuted}>
              Units verified
            </StyledText>
            <StyledText variant="monoSmall" color={textColor}>
              {progress.unitsVerified}/{progress.unitsRequired}
            </StyledText>
          </View>
          <View style={[styles.track, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: successColor, width: `${unitsPct * 100}%` },
              ]}
            />
          </View>
        </View>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <StyledText variant="label" color={iconMuted}>
              Lines complete
            </StyledText>
            <StyledText variant="monoSmall" color={textColor}>
              {progress.linesVerified}/{progress.totalLines}
            </StyledText>
          </View>
          <View style={[styles.track, { backgroundColor: borderColor }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: successColor, width: `${linesPct * 100}%` },
              ]}
            />
          </View>
        </View>
        <StyledText variant="caption" color={iconMuted}>
          {formatPackJobStatus(job.status)}
        </StyledText>
        {readyForDispatch ? (
          <View style={[styles.message, { borderColor: successColor }]}>
            <StyledText variant="label" color={successColor}>
              Packed — ready for rider handoff.
            </StyledText>
          </View>
        ) : verificationComplete ? (
          <StyledText variant="caption" color={successColor}>
            All units verified — print and link the shipping label.
          </StyledText>
        ) : job.status === "ready" ? (
          <StyledText variant="caption" color={warningColor}>
            Pick complete — start packing to verify units at this station.
          </StyledText>
        ) : (
          <StyledText variant="caption" color={iconMuted}>
            Scan each picked unit barcode to confirm contents before sealing.
          </StyledText>
        )}
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
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  body: {
    padding: 14,
    gap: 12,
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
    borderWidth: FLOOR_BORDER,
    padding: 10,
  },
});
