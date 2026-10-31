import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickJobDetail, PickLine } from "@/interfaces/picker";
import {
  allOpenLinesBlocked,
  formatNextScanHint,
  pickJobProgress,
} from "@/utils/pickerJob";

interface PickJobProgressProps {
  job: PickJobDetail;
  activeLine?: PickLine | null;
}

export default function PickJobProgressCard({
  job,
  activeLine,
}: PickJobProgressProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const textColor = useThemeColor({}, "text");

  const progress = pickJobProgress(job);
  const readyForPack = progress.readyForPack;
  const allBlocked = allOpenLinesBlocked(job);
  const linesPct =
    progress.total > 0 ? progress.linesComplete / progress.total : 0;
  const unitsPct =
    progress.unitsRequired > 0 ? progress.unitsPicked / progress.unitsRequired : 0;

  return (
    <View style={[styles.card, flatPanel, { backgroundColor: cardColor, borderColor }]}>
      <View style={[styles.band, { backgroundColor: successColor }]}>
        <StyledText variant="eyebrow" style={styles.bandText}>
          PICK PROGRESS
        </StyledText>
      </View>
      <View style={styles.body}>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <StyledText variant="label" color={iconMuted}>
              Lines complete
            </StyledText>
            <StyledText variant="monoSmall" color={textColor}>
              {progress.linesComplete}/{progress.total}
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
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <StyledText variant="label" color={iconMuted}>
              Units picked
            </StyledText>
            <StyledText variant="monoSmall" color={textColor}>
              {progress.unitsPicked}/{progress.unitsRequired}
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
        {readyForPack ? (
          <View style={[styles.message, { borderColor: successColor }]}>
            <StyledText variant="label" color={successColor}>
              Pick floor complete — ready for pack station.
            </StyledText>
          </View>
        ) : allBlocked ? (
          <StyledText variant="caption" color={warningColor}>
            Open lines are blocked pending supervisor review.
          </StyledText>
        ) : activeLine ? (
          <StyledText variant="caption" color={iconMuted}>
            {formatNextScanHint(activeLine)}
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
    borderWidth: FLOOR_BORDER,
    padding: 10,
  },
});
