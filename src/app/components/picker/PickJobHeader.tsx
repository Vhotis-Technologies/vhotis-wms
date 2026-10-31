import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, FLOOR_ACCENT_WIDTH, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import { formatPickJobStatus } from "@/constants/picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickJobDetail } from "@/interfaces/picker";

interface PickJobHeaderProps {
  job: PickJobDetail;
}

export default function PickJobHeader({ job }: PickJobHeaderProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  const statusColor = job.status === "picking" ? successColor : warningColor;

  return (
    <View style={[styles.container, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.titleBand, { backgroundColor: textColor }]}>
        <StyledText variant="eyebrow" style={[styles.titleBandText, { color: bandForeground }]}>
          PICK JOB
        </StyledText>
      </View>
      <View style={styles.body}>
        <StyledText variant="mono" color={successColor}>
          {job.order_id}
        </StyledText>
        <StyledText variant="display" style={styles.storeName}>
          {job.store_name}
        </StyledText>
        <StyledText variant="body" color={iconMuted}>
          {job.item_count} pick lines · {job.id}
        </StyledText>
        <View style={[styles.statusRow, { borderColor }]}>
          <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
          <StyledText variant="label" color={statusColor} style={styles.statusText}>
            {formatPickJobStatus(job.status).toUpperCase()}
          </StyledText>
        </View>
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
    gap: 8,
  },
  storeName: {
    fontSize: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: FLOOR_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusStripe: {
    width: FLOOR_ACCENT_WIDTH,
    height: 20,
  },
  statusText: {
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});
