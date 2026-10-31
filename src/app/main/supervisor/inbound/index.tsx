import { type Href, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InboundApprovalCard from "@/app/components/supervisor/InboundApprovalCard";
import FloorQueueHeader from "@/app/components/shared/FloorQueueHeader";
import StyledText from "@/app/components/StyledText";
import { supervisorInboundDetailHref } from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorInbound } from "@/hooks/useSupervisorInbound";
import { sortInboundApprovals } from "@/utils/supervisorInbound";

export default function SupervisorInboundApprovalsScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  const { employee, shiftLabel, hasPermission } = useSupervisor();
  const { approvals, isLoading, error, refreshApprovals } = useSupervisorInbound();

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  const canApprove = hasPermission("approve_inbound_shipments");

  useFocusEffect(
    useCallback(() => {
      if (canApprove) {
        void refreshApprovals();
      }
    }, [canApprove, refreshApprovals]),
  );

  const sortedApprovals = useMemo(
    () => sortInboundApprovals(approvals?.approvals ?? []),
    [approvals],
  );

  const pendingVarianceTotal = useMemo(
    () =>
      sortedApprovals.reduce(
        (total, item) => total + item.pendingVarianceCount,
        0,
      ),
    [sortedApprovals],
  );

  const inboxIsEmpty = !isLoading && sortedApprovals.length === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshApprovals}
            tintColor={buttonColor}
          />
        }
      >
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Control tower
          </StyledText>
        </Pressable>

        <FloorQueueHeader
          employeeName={employeeName}
          badgeLabel={shiftLabel}
          badgeVariant="neutral"
          badgePrefix="Inbound · "
        />

        {!canApprove ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${warningColor}18`, borderColor: `${warningColor}44` },
            ]}
          >
            <StyledText variant="label" color={warningColor}>
              Your profile cannot approve inbound shipments.
            </StyledText>
          </View>
        ) : null}

        {pendingVarianceTotal > 0 ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="label" color={errorColor}>
              {pendingVarianceTotal} receipt line
              {pendingVarianceTotal === 1 ? "" : "s"} waiting for supervisor
              approval.
            </StyledText>
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

        {isLoading && sortedApprovals.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        ) : null}

        {inboxIsEmpty ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="headline">Dock is clear</StyledText>
            <StyledText variant="body" color={iconMuted} style={styles.emptyCopy}>
              No inbound shipments need variance review or supervisor sign-off.
            </StyledText>
          </View>
        ) : (
          <View style={styles.list}>
            {sortedApprovals.map((approval) => (
              <InboundApprovalCard
                key={approval.id}
                approval={approval}
                onPress={() =>
                  router.push(supervisorInboundDetailHref(approval.id) as Href)
                }
              />
            ))}
          </View>
        )}
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
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadingBlock: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  emptyCopy: {
    lineHeight: 22,
  },
  list: {
    gap: 12,
  },
});
