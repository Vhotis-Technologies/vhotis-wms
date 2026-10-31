import { type Href, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import InventoryDamageClaimCard from "@/app/components/supervisor/InventoryDamageClaimCard";
import InventoryRecountCard from "@/app/components/supervisor/InventoryRecountCard";
import FloorQueueHeader from "@/app/components/shared/FloorQueueHeader";
import StyledText from "@/app/components/StyledText";
import {
  supervisorDamageClaimDetailHref,
  supervisorRecountTaskHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorInventory } from "@/hooks/useSupervisorInventory";
import {
  INVENTORY_TASK_FILTERS,
  type InventoryTaskFilter,
  supervisorHasInventoryAccess,
} from "@/utils/supervisorInventory";

export default function SupervisorInventoryTasksScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  const [filter, setFilter] = useState<InventoryTaskFilter>("all");

  const { employee, shiftLabel, hasPermission } = useSupervisor();
  const { tasks, isLoading, error, refreshTasks } = useSupervisorInventory();

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  const canAccessInventory = supervisorHasInventoryAccess(hasPermission);
  const canOverride = hasPermission("override_stock_counts");
  const canApproveDamage = hasPermission("approve_damage_claims");

  useFocusEffect(
    useCallback(() => {
      if (canAccessInventory) {
        void refreshTasks();
      }
    }, [canAccessInventory, refreshTasks]),
  );

  const recountTasks = useMemo(() => {
    if (!canOverride) {
      return [];
    }
    return tasks?.recountTasks ?? [];
  }, [canOverride, tasks]);

  const damageClaims = useMemo(() => {
    if (!canApproveDamage) {
      return [];
    }
    return tasks?.damageClaims ?? [];
  }, [canApproveDamage, tasks]);

  const visibleTasks = useMemo(() => {
    if (filter === "recount") {
      return { recounts: recountTasks, claims: [] as typeof damageClaims };
    }
    if (filter === "damage") {
      return { recounts: [] as typeof recountTasks, claims: damageClaims };
    }
    return { recounts: recountTasks, claims: damageClaims };
  }, [damageClaims, filter, recountTasks]);

  const totalVisible =
    visibleTasks.recounts.length + visibleTasks.claims.length;
  const inboxIsEmpty = !isLoading && totalVisible === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshTasks}
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
          badgePrefix="Inventory · "
        />

        {!canAccessInventory ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${warningColor}18`, borderColor: `${warningColor}44` },
            ]}
          >
            <StyledText variant="label" color={warningColor}>
              Your profile cannot manage inventory tasks.
            </StyledText>
          </View>
        ) : null}

        {tasks && tasks.summary.total > 0 ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="label" color={errorColor}>
              {tasks.summary.pendingRecounts} recount
              {tasks.summary.pendingRecounts === 1 ? "" : "s"} ·{" "}
              {tasks.summary.pendingDamageClaims} damage claim
              {tasks.summary.pendingDamageClaims === 1 ? "" : "s"} waiting.
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {INVENTORY_TASK_FILTERS.map((option) => {
            const active = filter === option.id;
            const disabled =
              (option.id === "recount" && !canOverride) ||
              (option.id === "damage" && !canApproveDamage);
            if (disabled) {
              return null;
            }
            return (
              <Pressable
                key={option.id}
                onPress={() => setFilter(option.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? `${buttonColor}22` : cardColor,
                    borderColor: active ? buttonColor : borderColor,
                  },
                ]}
              >
                <StyledText
                  variant="caption"
                  color={active ? buttonColor : iconMuted}
                >
                  {option.label}
                </StyledText>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading && totalVisible === 0 ? (
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
            <StyledText variant="headline">Inventory is clear</StyledText>
            <StyledText variant="body" color={iconMuted} style={styles.emptyCopy}>
              No pending recounts or damage claims need supervisor action.
            </StyledText>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleTasks.recounts.map((task) => (
              <InventoryRecountCard
                key={`recount-${task.id}`}
                task={task}
                onPress={() =>
                  router.push(supervisorRecountTaskHref(task.exceptionId) as Href)
                }
              />
            ))}
            {visibleTasks.claims.map((claim) => (
              <InventoryDamageClaimCard
                key={`damage-${claim.id}`}
                claim={claim}
                onPress={() =>
                  router.push(supervisorDamageClaimDetailHref(claim.claimId) as Href)
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
  filterRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
