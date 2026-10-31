import { type Href, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ResolvedExceptionCard from "@/app/components/supervisor/ResolvedExceptionCard";
import FloorQueueHeader from "@/app/components/shared/FloorQueueHeader";
import StyledText from "@/app/components/StyledText";
import {
  SUPERVISOR_HISTORY_DAY_FILTERS,
  supervisorExceptionDetailHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorHistory } from "@/hooks/useSupervisorHistory";
import type { PickExceptionResolution } from "@/interfaces/supervisor";
import { formatExceptionResolutionLabel } from "@/utils/supervisorResolution";

const RESOLUTION_FILTERS: {
  id: PickExceptionResolution | "all";
  label: string;
}[] = [
  { id: "all", label: "All resolutions" },
  { id: "relocated", label: "Relocated" },
  { id: "partial_fulfil", label: "Partial" },
  { id: "recount_ordered", label: "Recount" },
  { id: "cancel_line", label: "Cancelled" },
  { id: "dismissed", label: "Dismissed" },
];

export default function SupervisorHistoryScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");

  const { employee, shiftLabel } = useSupervisor();
  const {
    history,
    days,
    setDays,
    resolution,
    setResolution,
    isLoading,
    error,
    refreshHistory,
  } = useSupervisorHistory(7);

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  useFocusEffect(
    useCallback(() => {
      void refreshHistory();
    }, [refreshHistory]),
  );

  useEffect(() => {
    void refreshHistory();
  }, [days, resolution, refreshHistory]);

  const listIsEmpty = !isLoading && (history?.exceptions.length ?? 0) === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshHistory}
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
          badgePrefix="History · "
        />

        <StyledText variant="body" color={iconMuted}>
          Search resolved pick exceptions by time window and resolution type.
        </StyledText>

        {error ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: `${buttonColor}14`, borderColor: `${buttonColor}44` },
            ]}
          >
            <StyledText variant="body" color={buttonColor}>
              {error}
            </StyledText>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {SUPERVISOR_HISTORY_DAY_FILTERS.map((option) => {
            const active = days === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setDays(option.id)}
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
          {RESOLUTION_FILTERS.map((option) => {
            const active = resolution === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setResolution(option.id)}
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
                  {option.id === "all"
                    ? option.label
                    : formatExceptionResolutionLabel(option.id)}
                </StyledText>
              </Pressable>
            );
          })}
        </ScrollView>

        {history ? (
          <StyledText variant="label" color={iconMuted}>
            {history.total} resolved exception{history.total === 1 ? "" : "s"}
          </StyledText>
        ) : null}

        {isLoading && !history ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        ) : null}

        {listIsEmpty ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="headline">No history yet</StyledText>
            <StyledText variant="body" color={iconMuted}>
              No resolved exceptions match the current filters.
            </StyledText>
          </View>
        ) : (
          <View style={styles.list}>
            {history?.exceptions.map((exception) => (
              <ResolvedExceptionCard
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
  list: {
    gap: 12,
  },
});
