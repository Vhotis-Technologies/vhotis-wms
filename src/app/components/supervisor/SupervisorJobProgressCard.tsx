import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorJobDetail } from "@/interfaces/supervisor";
import { pickJobProgress } from "@/utils/pickerJob";

interface SupervisorJobProgressCardProps {
  job: SupervisorJobDetail;
}

export default function SupervisorJobProgressCard({
  job,
}: SupervisorJobProgressCardProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  const pickProgress = pickJobProgress({
    id: job.id,
    order_id: job.orderId,
    store_name: job.storeName,
    item_count: job.itemCount,
    zones: job.zones,
    priority: false,
    estimated_minutes: null,
    status: job.status === "picking" ? "picking" : "reserved",
    pick_lines: job.pickLines,
  });

  return (
    <View
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <StyledText variant="eyebrow" color={iconMuted}>
        JOB PROGRESS
      </StyledText>

      <View style={styles.section}>
        <StyledText variant="label">Pick floor</StyledText>
        <StyledText variant="bodyMedium">
          {pickProgress.linesComplete}/{pickProgress.total} lines complete
        </StyledText>
        <StyledText variant="bodyMedium">
          {pickProgress.unitsPicked}/{pickProgress.unitsRequired} units picked
        </StyledText>
        {pickProgress.linesBlocked > 0 ? (
          <StyledText variant="caption" color={errorColor}>
            {pickProgress.linesBlocked} line
            {pickProgress.linesBlocked === 1 ? "" : "s"} blocked by exceptions
          </StyledText>
        ) : pickProgress.readyForPack ? (
          <StyledText variant="caption" color={successColor}>
            Pick floor complete — ready for pack.
          </StyledText>
        ) : null}
      </View>

      {job.showPack ? (
        <View style={[styles.section, styles.packSection, { borderColor }]}>
          <StyledText variant="label">Pack station</StyledText>
          <StyledText variant="bodyMedium">
            {job.unitsVerified}/{job.unitsRequired} units verified
          </StyledText>
          <StyledText variant="caption" color={iconMuted}>
            {job.stationLabel}
            {job.boxHint ? ` · ${job.boxHint}` : ""}
          </StyledText>
          <StyledText variant="caption" color={iconMuted}>
            Label {job.labelLinked ? "linked" : job.labelPrinted ? "printed" : "pending"}
          </StyledText>
          {job.hasPendingExceptions ? (
            <StyledText variant="caption" color={warningColor}>
              Pack may be blocked until exceptions are cleared.
            </StyledText>
          ) : null}
        </View>
      ) : (
        <StyledText variant="caption" color={iconMuted}>
          Pack progress appears once pick floor work is complete.
        </StyledText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  section: {
    gap: 4,
  },
  packSection: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
