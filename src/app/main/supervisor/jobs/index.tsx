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

import FloorQueueHeader from "@/app/components/shared/FloorQueueHeader";
import JobQueueCard from "@/app/components/shared/JobQueueCard";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import StyledText from "@/app/components/StyledText";
import {
  SUPERVISOR_JOB_SEGMENT_FILTERS,
  formatSupervisorJobSegment,
  supervisorJobCardTitle,
  supervisorJobDetailHref,
  supervisorJobHubSubtitle,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorJobs } from "@/hooks/useSupervisorJobs";
import type { SupervisorJobSegment } from "@/interfaces/supervisor";

export default function SupervisorJobsScreen() {
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: string }>();

  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");

  const { employee, shiftLabel } = useSupervisor();
  const {
    jobs,
    segment,
    setSegment,
    isLoading,
    error,
    refreshJobs,
  } = useSupervisorJobs(segmentParam);

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  useFocusEffect(
    useCallback(() => {
      void refreshJobs();
    }, [refreshJobs]),
  );

  const boardIsEmpty = !isLoading && jobs.length === 0;

  const handleSegmentChange = (nextSegment: SupervisorJobSegment | "all") => {
    setSegment(nextSegment);
  };

  const goToJob = (jobId: string) => {
    router.push(supervisorJobDetailHref(jobId) as Href);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshJobs}
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
          badgePrefix="Job board · "
        />

        <View style={styles.intro}>
          <StyledText variant="headline">Active fulfillment jobs</StyledText>
          <StyledText variant="body" color={iconMuted}>
            Read-only oversight across pick, pack, and dispatch. Tap a job for
            inspection details in the next phase.
          </StyledText>
        </View>

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
          {SUPERVISOR_JOB_SEGMENT_FILTERS.map((option) => {
            const active = segment === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => handleSegmentChange(option.id)}
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

        {segment !== "all" ? (
          <StyledText variant="caption" color={iconMuted}>
            Showing {formatSupervisorJobSegment(segment as SupervisorJobSegment)}{" "}
            jobs · {jobs.length} result{jobs.length === 1 ? "" : "s"}
          </StyledText>
        ) : null}

        {isLoading && jobs.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        ) : null}

        {boardIsEmpty ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="headline">No jobs in this lane</StyledText>
            <StyledText variant="body" color={iconMuted} style={styles.emptyCopy}>
              {segment === "all"
                ? "No active fulfillment jobs in the warehouse right now."
                : `No jobs currently marked as ${formatSupervisorJobSegment(
                    segment as SupervisorJobSegment,
                  ).toLowerCase()}. Pull to refresh when floor activity changes.`}
            </StyledText>
          </View>
        ) : (
          <View style={styles.list}>
            {jobs.map((job) => (
              <JobQueueCard
                key={job.id}
                orderId={job.orderId}
                title={supervisorJobCardTitle(job)}
                subtitle={supervisorJobHubSubtitle(job)}
                priority={job.hasPendingExceptions}
                onPress={() => goToJob(job.id)}
                footerLeft={job.zones.map((zone) => (
                  <ZoneBadge key={zone} zone={zone} />
                ))}
                footerRight={
                  <StyledText
                    variant="caption"
                    color={
                      job.hasPendingExceptions
                        ? errorColor
                        : job.segment === "dispatch"
                          ? successColor
                          : job.segment === "picking"
                            ? warningColor
                            : iconMuted
                    }
                    style={styles.statusLabel}
                  >
                    {job.hasPendingExceptions
                      ? `${job.pendingExceptionCount} exception${
                          job.pendingExceptionCount === 1 ? "" : "s"
                        }`
                      : formatSupervisorJobSegment(job.segment)}
                  </StyledText>
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
  intro: {
    gap: 6,
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
  statusLabel: {
    textAlign: "right",
  },
});
