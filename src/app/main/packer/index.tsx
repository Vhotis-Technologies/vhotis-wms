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
  formatPackJobStatus,
  formatPackerShiftLabel,
  packJobHubSubtitle,
  packJobOpenHref,
  packJobPrimaryActionLabel,
} from "@/constants/packer";
import { useThemeColor } from "@/hooks/useThemeColor";
import { usePacker } from "@/hooks/usePacker";
import type { PackJobStatus, PackJobSummary } from "@/interfaces/packer";

function packJobStatusColor(
  status: PackJobStatus,
  successColor: string,
  warningColor: string,
  iconMuted: string,
): string {
  if (status === "packing") return successColor;
  if (status === "packed") return warningColor;
  return iconMuted;
}

export default function PackerQueueScreen() {
  const bgColor = useThemeColor({}, "background");
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const warningColor = useThemeColor({}, "warning");
  const buttonColor = useThemeColor({}, "button");

  const {
    employee,
    stats,
    jobs,
    isLoading,
    error,
    refreshJobs,
    priorityJob,
    secondaryJobs,
  } = usePacker();

  const employeeName = employee?.full_name ?? employee?.employee_id ?? "Packer";

  const goToJob = (job: (typeof jobs)[number]) => {
    router.push(packJobOpenHref(job) as Href);
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
          badgeLabel={formatPackerShiftLabel(employee)}
          titleBand="PACK STATION"
          bandColor={buttonColor}
          bandTextColor="#FFFFFF"
        />

        {stats ? (
          <FloorStatGrid
            items={[
              { value: stats.packedToday, label: "Packed today", tone: "success" },
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

        <FloorSectionBand title="PACK QUEUE" />

        {hubIsEmpty ? (
          <View style={[styles.emptyState, flatPanel, { borderColor, backgroundColor: cardColor }]}>
            <StyledText variant="body" color={iconMuted}>
              No pack jobs in queue. Orders appear here after picking is complete — pull to refresh
              when new orders are ready.
            </StyledText>
          </View>
        ) : null}

        {priorityJob ? (
          <View style={styles.priorityBlock}>
            <JobQueueCard
              orderId={priorityJob.order_id}
              title={`${priorityJob.item_count} items to pack`}
              subtitle={packJobHubSubtitle(priorityJob)}
              priority
              onPress={() => goToJob(priorityJob)}
              footerLeft={
                <StyledText variant="caption" color={iconMuted}>
                  {priorityJob.station_label} · {priorityJob.box_hint}
                </StyledText>
              }
              footerRight={
                <StyledText
                  variant="caption"
                  color={packJobStatusColor(
                    priorityJob.status,
                    successColor,
                    warningColor,
                    iconMuted,
                  )}
                  style={styles.statusLabel}
                >
                  {formatPackJobStatus(priorityJob.status).toUpperCase()}
                </StyledText>
              }
            />
            <StyledButton
              title={packJobPrimaryActionLabel(priorityJob)}
              onPress={() => goToJob(priorityJob)}
              variant="large"
              buttonStyles={[flatButton, styles.startButton]}
            />
          </View>
        ) : null}

        {secondaryJobs.length > 0 ? (
          <View style={[styles.secondaryList, flatPanel, { borderColor }]}>
            {secondaryJobs.map((job: PackJobSummary, index) => (
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
                  title={`${job.item_count} items to pack`}
                  subtitle={packJobHubSubtitle(job)}
                  onPress={() => goToJob(job)}
                  footerLeft={
                    <StyledText variant="caption" color={iconMuted}>
                      {job.station_label} · {job.box_hint}
                    </StyledText>
                  }
                  footerRight={
                    <StyledText
                      variant="caption"
                      color={packJobStatusColor(
                        job.status,
                        successColor,
                        warningColor,
                        iconMuted,
                      )}
                      style={styles.statusLabel}
                    >
                      {formatPackJobStatus(job.status).toUpperCase()}
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
