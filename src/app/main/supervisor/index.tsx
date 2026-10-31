import { MaterialIcons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FloorQueueHeader from "@/app/components/shared/FloorQueueHeader";
import SupervisorManagerPanel from "@/app/components/supervisor/SupervisorManagerPanel";
import SupervisorPulseBar from "@/app/components/supervisor/SupervisorPulseBar";
import SupervisorQuickLinks from "@/app/components/supervisor/SupervisorQuickLinks";
import SupervisorSectionCard from "@/app/components/supervisor/SupervisorSectionCard";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import {
  SUPERVISOR_HOME_SECTIONS,
  formatManagementRole,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisorHomePolling } from "@/hooks/useSupervisorHomePolling";
import { useSupervisorManagerInsights } from "@/hooks/useSupervisorManagerInsights";
import { useSupervisor } from "@/hooks/useSupervisor";
import { supervisorHasInventoryAccess } from "@/utils/supervisorInventory";

export default function SupervisorHomeScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  const {
    employee,
    profile,
    shiftLabel,
    hasPermission,
    logout,
    isLoading,
    pendingExceptionCount,
    staleExceptionCount,
    pulseTiles,
    stats,
    statsLoading,
    statsError,
    statsUpdatedLabel,
    refreshHome,
  } = useSupervisor();

  const canApproveExceptions = hasPermission("approve_exceptions");

  const {
    isManager,
    insights: managerInsights,
    isLoading: managerLoading,
    refreshInsights,
  } = useSupervisorManagerInsights();

  useSupervisorHomePolling(async () => {
    await refreshHome();
    if (isManager) {
      await refreshInsights();
    }
  });

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  const handleLogout = async () => {
    await logout();
    router.replace("/" as Href);
  };

  const homeIsRefreshing = statsLoading || isLoading;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={homeIsRefreshing}
            onRefresh={() => {
              void refreshHome();
            }}
            tintColor={buttonColor}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={[styles.roleBadge, { backgroundColor: `${buttonColor}22` }]}>
            <StyledText variant="eyebrow" color={buttonColor}>
              Supervisor workspace
            </StyledText>
          </View>
        </View>

        <FloorQueueHeader
          employeeName={employeeName}
          badgeLabel={shiftLabel}
          badgeVariant="accent"
        />

        <View
          style={[
            styles.statsChip,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <MaterialIcons name="verified-user" size={18} color={successColor} />
          <StyledText variant="bodyMedium">
            {formatManagementRole(profile?.management_role)}
          </StyledText>
          <StyledText variant="monoSmall" color={iconMuted}>
            · {profile?.exceptions_resolved_today ?? 0} resolved today
          </StyledText>
        </View>

        {stats ? (
          <SupervisorPulseBar
            tiles={pulseTiles}
            updatedLabel={statsUpdatedLabel}
            isLoading={statsLoading}
          />
        ) : statsLoading ? (
          <StyledText variant="body" color={iconMuted}>
            Loading warehouse pulse...
          </StyledText>
        ) : null}

        {statsError ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="body" color={errorColor}>
              {statsError} Pull to refresh when back online.
            </StyledText>
          </View>
        ) : null}

        <SupervisorQuickLinks />

        {isManager && managerInsights ? (
          <SupervisorManagerPanel
            insights={managerInsights}
            isLoading={managerLoading}
          />
        ) : null}

        {canApproveExceptions && pendingExceptionCount > 0 ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: `${errorColor}12`,
                borderColor: `${errorColor}44`,
              },
            ]}
          >
            <MaterialIcons name="priority-high" size={18} color={errorColor} />
            <StyledText variant="label" color={errorColor} style={styles.alertCopy}>
              {pendingExceptionCount} pending exception
              {pendingExceptionCount === 1 ? "" : "s"}
              {staleExceptionCount > 0
                ? ` · ${staleExceptionCount} urgent`
                : ""}
              {stats && stats.oldestExceptionMinutes > 0
                ? ` · oldest ${stats.oldestExceptionMinutes}m`
                : ""}
            </StyledText>
          </View>
        ) : null}

        <View style={styles.sectionIntro}>
          <StyledText variant="headline">Control tower</StyledText>
          <StyledText variant="body" color={iconMuted}>
            Warehouse oversight across inbound, pick, pack, and exceptions.
          </StyledText>
        </View>

        <View style={styles.cards}>
          {SUPERVISOR_HOME_SECTIONS.map((section) => {
            const permissionGranted = section.permission
              ? hasPermission(section.permission)
              : true;
            const enabled =
              section.id === "exceptions" || section.id === "inbound"
                ? permissionGranted
                : section.id === "inventory"
                  ? supervisorHasInventoryAccess(hasPermission)
                  : section.id === "jobs" || section.id === "floor"
                    ? true
                    : false;

            const badgeCount =
              section.id === "exceptions"
                ? pendingExceptionCount
                : section.id === "inbound" && stats
                  ? stats.inboundReceiving
                  : section.id === "inventory" && stats
                    ? stats.pendingInventoryTasks
                    : section.id === "jobs" && stats
                      ? stats.blockedJobs + stats.pickQueue + stats.packQueue
                      : section.id === "floor" && stats
                        ? stats.staffOnFloor.total
                        : 0;

            return (
              <SupervisorSectionCard
                key={section.id}
                section={section}
                enabled={enabled}
                badgeCount={badgeCount}
              />
            );
          })}
        </View>

        <View style={styles.permissionPanel}>
          <StyledText variant="label" color={iconMuted}>
            Your permissions
          </StyledText>
          <View style={styles.permissionGrid}>
            {(
              [
                ["approve_exceptions", "Exceptions"],
                ["manage_assignments", "Assignments"],
                ["approve_inbound_shipments", "Inbound"],
                ["override_stock_counts", "Stock override"],
                ["approve_damage_claims", "Damage claims"],
              ] as const
            ).map(([key, label]) => (
              <View
                key={key}
                style={[
                  styles.permissionPill,
                  {
                    backgroundColor: hasPermission(key)
                      ? `${successColor}18`
                      : `${iconMuted}12`,
                    borderColor: hasPermission(key)
                      ? `${successColor}44`
                      : borderColor,
                  },
                ]}
              >
                <MaterialIcons
                  name={hasPermission(key) ? "check-circle" : "block"}
                  size={14}
                  color={hasPermission(key) ? successColor : iconMuted}
                />
                <StyledText
                  variant="caption"
                  color={hasPermission(key) ? successColor : iconMuted}
                >
                  {label}
                </StyledText>
              </View>
            ))}
          </View>
        </View>

        <StyledButton
          title="Sign out"
          variant="medium"
          onPress={handleLogout}
          disabled={isLoading}
          buttonStyles={[
            styles.logoutButton,
            { borderColor, backgroundColor: cardColor },
          ]}
        />
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
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  alertCopy: {
    flex: 1,
  },
  sectionIntro: {
    gap: 6,
  },
  cards: {
    gap: 14,
  },
  permissionPanel: {
    gap: 10,
  },
  permissionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permissionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoutButton: {
    width: "100%",
    borderWidth: 1,
  },
});
