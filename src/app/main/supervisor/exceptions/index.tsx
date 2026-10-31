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

import ExceptionInboxCard from "@/app/components/supervisor/ExceptionInboxCard";
import FloorQueueHeader from "@/app/components/shared/FloorQueueHeader";
import StyledText from "@/app/components/StyledText";
import { supervisorExceptionDetailHref } from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import type { PickExceptionType } from "@/interfaces/supervisor";
import type { ZoneBadge } from "@/interfaces/picker";
import {
  EXCEPTION_TYPE_FILTERS,
  EXCEPTION_ZONE_FILTERS,
  filterPickExceptions,
  sortPickExceptions,
} from "@/utils/supervisorExceptions";

export default function SupervisorExceptionsScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");

  const [typeFilter, setTypeFilter] = useState<"all" | PickExceptionType>("all");
  const [zoneFilter, setZoneFilter] = useState<"all" | ZoneBadge>("all");

  const {
    employee,
    shiftLabel,
    hasPermission,
    exceptions,
    exceptionsLoading,
    exceptionsError,
    staleExceptionCount,
    refreshExceptions,
  } = useSupervisor();

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  const canApprove = hasPermission("approve_exceptions");

  useFocusEffect(
    useCallback(() => {
      if (canApprove) {
        refreshExceptions();
      }
    }, [canApprove, refreshExceptions]),
  );

  const filteredExceptions = useMemo(
    () =>
      sortPickExceptions(
        filterPickExceptions(exceptions, typeFilter, zoneFilter),
      ),
    [exceptions, typeFilter, zoneFilter],
  );

  const inboxIsEmpty = !exceptionsLoading && filteredExceptions.length === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={exceptionsLoading}
            onRefresh={refreshExceptions}
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
          badgePrefix="Exceptions · "
        />

        {!canApprove ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${warningColor}18`, borderColor: `${warningColor}44` },
            ]}
          >
            <StyledText variant="label" color={warningColor}>
              Your profile cannot approve exceptions.
            </StyledText>
          </View>
        ) : null}

        {staleExceptionCount > 0 ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="label" color={errorColor}>
              {staleExceptionCount} exception
              {staleExceptionCount === 1 ? "" : "s"} waiting over 5 minutes —
              pick and pack are blocked.
            </StyledText>
          </View>
        ) : null}

        {exceptionsError ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${errorColor}14`, borderColor: `${errorColor}44` },
            ]}
          >
            <StyledText variant="body" color={errorColor}>
              {exceptionsError}
            </StyledText>
          </View>
        ) : null}

        <View style={styles.filterBlock}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {EXCEPTION_TYPE_FILTERS.map((option) => {
              const active = typeFilter === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setTypeFilter(option.id)}
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {EXCEPTION_ZONE_FILTERS.map((option) => {
              const active = zoneFilter === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setZoneFilter(option.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? `${successColor}18` : cardColor,
                      borderColor: active ? successColor : borderColor,
                    },
                  ]}
                >
                  <StyledText
                    variant="caption"
                    color={active ? successColor : iconMuted}
                  >
                    {option.label}
                  </StyledText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {exceptionsLoading && exceptions.length === 0 ? (
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
            <StyledText variant="headline">Floor is clear</StyledText>
            <StyledText variant="body" color={iconMuted} style={styles.emptyCopy}>
              {exceptions.length === 0
                ? "No pending pick exceptions. Jobs can move through pick and pack without supervisor review."
                : "No exceptions match the current filters."}
            </StyledText>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredExceptions.map((exception) => (
              <ExceptionInboxCard
                key={exception.id}
                exception={exception}
                onPress={() =>
                  router.push(supervisorExceptionDetailHref(exception.id) as Href)
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
  filterBlock: {
    gap: 10,
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
