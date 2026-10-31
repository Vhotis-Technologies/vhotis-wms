import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { formatStatsGeneratedLabel } from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SupervisorManagerInsights } from "@/interfaces/supervisor";

interface SupervisorManagerPanelProps {
  insights: SupervisorManagerInsights;
  isLoading?: boolean;
}

export default function SupervisorManagerPanel({
  insights,
  isLoading = false,
}: SupervisorManagerPanelProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");

  return (
    <View
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="headline">Manager insights</StyledText>
        <StyledText variant="caption" color={iconMuted}>
          {formatStatsGeneratedLabel(insights.generatedAt)}
        </StyledText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Resolved today
          </StyledText>
          <StyledText variant="stat" color={successColor}>
            {insights.warehouseExceptionsResolvedToday}
          </StyledText>
        </View>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Pending now
          </StyledText>
          <StyledText variant="stat" color={buttonColor}>
            {insights.dashboard.pendingExceptions}
          </StyledText>
        </View>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Blocked jobs
          </StyledText>
          <StyledText variant="stat">
            {insights.dashboard.blockedJobs}
          </StyledText>
        </View>
      </View>

      <StyledText variant="label" color={iconMuted}>
        Supervisor roster
      </StyledText>

      {isLoading ? (
        <StyledText variant="body" color={iconMuted}>
          Refreshing manager data...
        </StyledText>
      ) : (
        <View style={styles.roster}>
          {insights.supervisorRoster.map((member) => (
            <View key={member.employeeId} style={styles.rosterRow}>
              <View style={styles.rosterCopy}>
                <StyledText variant="bodyMedium">{member.employeeName}</StyledText>
                <StyledText variant="caption" color={iconMuted}>
                  {member.managementRole} · {member.exceptionsResolvedToday} resolved
                </StyledText>
              </View>
              <StyledText variant="caption" color={iconMuted}>
                {Math.round(member.avgExceptionResolutionMinutes)}m avg
              </StyledText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCell: {
    minWidth: "28%",
    gap: 4,
  },
  roster: {
    gap: 10,
  },
  rosterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rosterCopy: {
    flex: 1,
    gap: 2,
  },
});
