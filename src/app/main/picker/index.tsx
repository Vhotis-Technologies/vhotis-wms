import { type Href, router } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import JobQueueCard from "@/app/components/shared/JobQueueCard";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import {
  FloorChromeFooter,
  FloorChromeHeader,
  FloorHubHeader,
  FloorSectionBand,
  FloorStatGrid,
} from "@/app/components/shared/FloorLayout";
import { flatButton, flatPanel, FLOOR_BORDER } from "@/app/components/shared/floorStyles";
import StyledButton from "@/app/components/StyledButton";
import StyledText from "@/app/components/StyledText";
import {
  formatPickJobStatus,
  formatPickerShiftLabel,
  pickJobHubSubtitle,
  pickJobOpenHref,
  pickJobPrimaryActionLabel,
} from "@/constants/picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import { usePicker } from "@/hooks/usePicker";

export default function PickerQueueScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");

  const {
    employee,
    jobs,
    stats,
    isLoading,
    error,
    refreshJobs,
    priorityJob,
    secondaryJobs,
  } = usePicker();

  const employeeName = employee?.full_name ?? employee?.employee_id ?? "Picker";

  const goToJob = (job: (typeof jobs)[number]) => {
    router.push(pickJobOpenHref(job) as Href);
  };

  const hubIsEmpty = !isLoading && jobs.length === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshJobs}
            tintColor={successColor}
          />
        }
      >
        <FloorChromeHeader />

        <FloorHubHeader
          employeeName={employeeName}
          badgeLabel={formatPickerShiftLabel(employee)}
          titleBand="PICKING FLOOR"
          bandColor={successColor}
        />

        {stats ? (
          <FloorStatGrid
            items={[
              { value: stats.pickedToday, label: "Picked today", tone: "success" },
              { value: stats.inQueue, label: "In queue", tone: "warning" },
              { value: `${stats.accuracy}%`, label: "Accuracy", tone: "primary" },
            ]}
          />
        ) : null}

        {isLoading && !stats ? (
          <ActivityIndicator color={successColor} style={styles.loader} />
        ) : null}

        {error ? (
          <StyledText variant="label" color={errorColor}>
            {error}
          </StyledText>
        ) : null}

        <FloorSectionBand title="ASSIGNED JOBS" />

        {hubIsEmpty ? (
          <View style={[styles.emptyState, flatPanel, { borderColor, backgroundColor: cardColor }]}>
            <StyledText variant="body" color={iconMuted}>
              No pick jobs in queue. Completed orders move to the pack station — pull to refresh
              when new orders are reserved.
            </StyledText>
          </View>
        ) : null}

        {priorityJob ? (
          <View style={styles.priorityBlock}>
            <JobQueueCard
              orderId={priorityJob.order_id}
              title={`${priorityJob.item_count} items to pick`}
              subtitle={pickJobHubSubtitle(priorityJob)}
              priority
              onPress={() => goToJob(priorityJob)}
              footerLeft={priorityJob.zones.map((zone) => (
                <ZoneBadge key={zone} zone={zone} />
              ))}
              footerRight={
                <StyledText
                  variant="caption"
                  color={
                    priorityJob.status === "picking" ? successColor : warningColor
                  }
                  style={styles.statusLabel}
                >
                  {formatPickJobStatus(priorityJob.status).toUpperCase()}
                </StyledText>
              }
            />
            <StyledButton
              title={pickJobPrimaryActionLabel(priorityJob)}
              onPress={() => goToJob(priorityJob)}
              variant="large"
              buttonStyles={[flatButton, styles.startButton]}
            />
          </View>
        ) : null}

        {secondaryJobs.length > 0 ? (
          <View style={[styles.secondaryList, flatPanel, { borderColor }]}>
            {secondaryJobs.map((job, index) => (
              <View
                key={job.id}
                style={
                  index > 0
                    ? { borderTopWidth: FLOOR_BORDER, borderTopColor: borderColor }
                    : undefined
                }
              >
                <JobQueueCard
                  orderId={job.order_id}
                  title={`${job.item_count} items to pick`}
                  subtitle={pickJobHubSubtitle(job)}
                  onPress={() => goToJob(job)}
                  footerLeft={job.zones.map((zone) => (
                    <ZoneBadge key={zone} zone={zone} />
                  ))}
                  footerRight={
                    <StyledText
                      variant="caption"
                      color={job.status === "picking" ? successColor : iconMuted}
                      style={styles.statusLabel}
                    >
                      {formatPickJobStatus(job.status).toUpperCase()}
                    </StyledText>
                  }
                />
              </View>
            ))}
          </View>
        ) : null}

        <FloorChromeFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loader: {
    marginTop: 24,
  },
  emptyState: {
    padding: 16,
  },
  priorityBlock: {
    gap: 8,
  },
  startButton: {
    paddingVertical: 16,
  },
  secondaryList: {
    overflow: "hidden",
  },
  statusLabel: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
