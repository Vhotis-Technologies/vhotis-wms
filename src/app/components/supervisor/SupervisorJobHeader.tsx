import { StyleSheet, View } from "react-native";

import ZoneBadge from "@/app/components/shared/ZoneBadge";
import StyledText from "@/app/components/StyledText";
import { formatSupervisorJobSegment } from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorJobDetail } from "@/interfaces/supervisor";

interface SupervisorJobHeaderProps {
  job: SupervisorJobDetail;
}

export default function SupervisorJobHeader({ job }: SupervisorJobHeaderProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const warningColor = useThemeColor({}, "warning");

  return (
    <View
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.topRow}>
        <StyledText variant="monoSmall" color={buttonColor}>
          {job.orderId}
        </StyledText>
        <View
          style={[
            styles.segmentBadge,
            {
              backgroundColor: job.hasPendingExceptions
                ? `${warningColor}18`
                : `${buttonColor}18`,
            },
          ]}
        >
          <StyledText
            variant="caption"
            color={job.hasPendingExceptions ? warningColor : buttonColor}
          >
            {formatSupervisorJobSegment(job.segment)}
          </StyledText>
        </View>
      </View>

      <StyledText variant="headline">{job.storeName}</StyledText>
      <StyledText variant="label" color={iconMuted}>
        {job.id}
        {job.warehouseCode ? ` · ${job.warehouseCode}` : ""}
      </StyledText>

      <View style={styles.zoneRow}>
        {job.zones.map((zone) => (
          <ZoneBadge key={zone} zone={zone} />
        ))}
      </View>

      <View style={styles.assigneeGrid}>
        <View style={styles.assigneeCell}>
          <StyledText variant="caption" color={iconMuted}>
            Picker
          </StyledText>
          <StyledText variant="bodyMedium">
            {job.assignedPickerName || "Unassigned"}
          </StyledText>
        </View>
        <View style={styles.assigneeCell}>
          <StyledText variant="caption" color={iconMuted}>
            Packer
          </StyledText>
          <StyledText variant="bodyMedium">
            {job.assignedPackerName || "Unassigned"}
          </StyledText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  segmentBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoneRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  assigneeGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  assigneeCell: {
    flex: 1,
    gap: 2,
  },
});
