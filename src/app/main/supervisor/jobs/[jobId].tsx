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

import PickLineList from "@/app/components/picker/PickLineList";
import PackItemList from "@/app/components/packer/PackItemList";
import PackProgressRing from "@/app/components/packer/PackProgressRing";
import SupervisorJobReassignPanel from "@/app/components/supervisor/SupervisorJobReassignPanel";
import SupervisorExceptionHistoryList from "@/app/components/supervisor/SupervisorExceptionHistoryList";
import SupervisorJobHeader from "@/app/components/supervisor/SupervisorJobHeader";
import SupervisorJobProgressCard from "@/app/components/supervisor/SupervisorJobProgressCard";
import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorJob } from "@/hooks/useSupervisorJob";

function parseJobId(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ? value : null;
}

export default function SupervisorJobDetailScreen() {
  const { jobId: rawJobId } = useLocalSearchParams<{ jobId: string }>();
  const jobId = parseJobId(rawJobId);

  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const errorColor = useThemeColor({}, "error");

  const { hasPermission } = useSupervisor();
  const { job, isLoading, error, refreshJob } = useSupervisorJob(jobId);
  const canOpenPending = hasPermission("approve_exceptions");
  const canManageAssignments = hasPermission("manage_assignments");

  useFocusEffect(
    useCallback(() => {
      if (jobId) {
        void refreshJob();
      }
    }, [jobId, refreshJob]),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          jobId ? (
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshJob}
              tintColor={buttonColor}
            />
          ) : undefined
        }
      >
        <Pressable onPress={() => router.back()}>
          <StyledText variant="label" color={iconMuted} style={styles.backLink}>
            ← Job board
          </StyledText>
        </Pressable>

        <StyledText variant="display">Job inspection</StyledText>

        {isLoading && !job ? (
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

        {job ? (
          <>
            <SupervisorJobHeader job={job} />
            <SupervisorJobProgressCard job={job} />

            <View style={styles.sectionIntro}>
              <StyledText variant="label">Pick lines</StyledText>
              <StyledText variant="caption" color={iconMuted}>
                Blocked lines are highlighted for supervisor review.
              </StyledText>
            </View>
            <PickLineList lines={job.pickLines} />

            {job.showPack ? (
              <>
                <View style={styles.sectionIntro}>
                  <StyledText variant="label">Pack progress</StyledText>
                </View>
                <PackProgressRing
                  current={job.unitsVerified}
                  total={job.unitsRequired}
                  label="Units verified"
                />
                <PackItemList lines={job.packLines} />
              </>
            ) : null}

            <SupervisorJobReassignPanel
              job={job}
              canManage={canManageAssignments}
              onUpdated={() => {
                void refreshJob();
              }}
            />

            <SupervisorExceptionHistoryList
              pendingExceptions={job.pendingExceptions}
              resolvedExceptions={job.resolvedExceptions}
              canOpenPending={canOpenPending}
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
              Job not found or no longer active in the warehouse pipeline.
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
    gap: 18,
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
  sectionIntro: {
    gap: 4,
  },
});
