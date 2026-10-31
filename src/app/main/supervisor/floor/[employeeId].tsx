import { type Href, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SupervisorFloorAssignmentPanel from "@/app/components/supervisor/SupervisorFloorAssignmentPanel";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import {
  formatFloorStaffStatus,
  formatFloorWorkArea,
  formatShiftDuration,
  supervisorJobDetailHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisorFloorEmployee } from "@/hooks/useSupervisorFloorEmployee";
import { useSupervisor } from "@/hooks/useSupervisor";

function parseEmployeeId(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ? decodeURIComponent(value) : null;
}

export default function SupervisorFloorEmployeeScreen() {
  const { employeeId: rawEmployeeId } = useLocalSearchParams<{
    employeeId: string;
  }>();
  const employeeId = parseEmployeeId(rawEmployeeId);

  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  const { member, isLoading, error, refreshMember } =
    useSupervisorFloorEmployee(employeeId);
  const { hasPermission } = useSupervisor();
  const canManageAssignments = hasPermission("manage_assignments");

  useFocusEffect(
    useCallback(() => {
      void refreshMember();
    }, [refreshMember]),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          employeeId ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshMember}
              tintColor={buttonColor}
            />
          ) : undefined
        }
      >
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Floor live
          </StyledText>
        </Pressable>

        <StyledText variant="display">Floor profile</StyledText>

        {isLoading && !member ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        ) : null}

        {error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="body" color={errorColor}>
              {error}
            </StyledText>
          </View>
        ) : null}

        {member ? (
          <>
            <View
              style={[
                styles.panel,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <StyledText variant="headline">{member.employeeName}</StyledText>
              <StyledText variant="monoSmall" color={buttonColor}>
                {member.employeeId}
              </StyledText>
              <StyledText variant="body" color={iconMuted}>
                {formatFloorWorkArea(member.workArea)} ·{" "}
                {formatShiftDuration(member.shiftMinutes)}
              </StyledText>
              <StyledText
                variant="label"
                color={member.isOnBreak ? warningColor : successColor}
              >
                {formatFloorStaffStatus(member)}
              </StyledText>
              {member.assignedByName ? (
                <StyledText variant="caption" color={iconMuted}>
                  Assigned by {member.assignedByName}
                </StyledText>
              ) : null}
            </View>

            <View
              style={[
                styles.panel,
                { backgroundColor: cardColor, borderColor },
              ]}
            >
              <StyledText variant="eyebrow" color={iconMuted}>
                SHIFT STATS
              </StyledText>
              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <StyledText variant="caption" color={iconMuted}>
                    Jobs done
                  </StyledText>
                  <StyledText variant="bodyMedium">
                    {member.totalJobsCompleted}
                  </StyledText>
                </View>
                <View style={styles.statCell}>
                  <StyledText variant="caption" color={iconMuted}>
                    Lines picked
                  </StyledText>
                  <StyledText variant="bodyMedium">
                    {member.totalLinesPicked}
                  </StyledText>
                </View>
                <View style={styles.statCell}>
                  <StyledText variant="caption" color={iconMuted}>
                    Units processed
                  </StyledText>
                  <StyledText variant="bodyMedium">
                    {member.totalUnitsProcessed}
                  </StyledText>
                </View>
                <View style={styles.statCell}>
                  <StyledText variant="caption" color={iconMuted}>
                    Exceptions raised
                  </StyledText>
                  <StyledText
                    variant="bodyMedium"
                    color={
                      member.totalExceptionsRaised > 0 ? warningColor : undefined
                    }
                  >
                    {member.totalExceptionsRaised}
                  </StyledText>
                </View>
              </View>
            </View>

            {member.currentFulfillmentJobId ? (
              <StyledButton
                title={
                  member.currentOrderId
                    ? `Inspect job ${member.currentOrderId}`
                    : "Inspect current job"
                }
                variant="medium"
                onPress={() =>
                  router.push(
                    supervisorJobDetailHref(member.currentFulfillmentJobId!) as Href,
                  )
                }
                buttonStyles={styles.jobButton}
              />
            ) : (
              <View
                style={[
                  styles.banner,
                  { backgroundColor: cardColor, borderColor },
                ]}
              >
                <StyledText variant="body" color={iconMuted}>
                  Not assigned to an active fulfillment job right now.
                </StyledText>
              </View>
            )}

            <SupervisorFloorAssignmentPanel
              member={member}
              canManage={canManageAssignments}
              onUpdated={() => {
                void refreshMember();
              }}
            />
          </>
        ) : !isLoading && !error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="body" color={iconMuted}>
              Employee not found or not clocked in.
            </StyledText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  backLink: {
    alignSelf: "flex-start",
  },
  loadingBlock: {
    paddingVertical: 24,
    alignItems: "center",
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  statCell: {
    minWidth: "42%",
    gap: 2,
  },
  jobButton: {
    width: "100%",
  },
});
