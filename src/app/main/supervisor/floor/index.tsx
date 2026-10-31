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
import FloorStatsBar from "@/app/components/shared/FloorStatsBar";
import FloorStaffAreaSection from "@/app/components/supervisor/FloorStaffAreaSection";
import StyledText from "@/app/components/StyledText";
import {
  FLOOR_WORK_AREA_SECTIONS,
  formatStatsGeneratedLabel,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSupervisor } from "@/hooks/useSupervisor";
import { useSupervisorFloor } from "@/hooks/useSupervisorFloor";

export default function SupervisorFloorScreen() {
  const bgColor = useThemeColor({}, "background");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const errorColor = useThemeColor({}, "error");

  const { employee, shiftLabel } = useSupervisor();
  const { roster, groupedStaff, isLoading, error, refreshFloor } =
    useSupervisorFloor();

  const employeeName =
    employee?.full_name ?? employee?.employee_id ?? "Supervisor";

  useFocusEffect(
    useCallback(() => {
      void refreshFloor();
    }, [refreshFloor]),
  );

  const rosterIsEmpty = !isLoading && (roster?.staff.length ?? 0) === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshFloor}
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
          badgePrefix="Floor live · "
        />

        <View style={styles.intro}>
          <StyledText variant="headline">Who is on the floor</StyledText>
          <StyledText variant="body" color={iconMuted}>
            Active shift sessions across inbound, pick, and pack. Tap a person
            for shift stats and current job context.
          </StyledText>
        </View>

        {roster ? (
          <>
            <FloorStatsBar
              items={[
                {
                  value: roster.summary.inbound,
                  label: "Inbound",
                  tone: "primary",
                },
                {
                  value: roster.summary.pick,
                  label: "Pick",
                  tone: "warning",
                },
                {
                  value: roster.summary.pack,
                  label: "Pack",
                  tone: "success",
                },
              ]}
            />
            <StyledText variant="caption" color={iconMuted}>
              {formatStatsGeneratedLabel(roster.generatedAt)}
            </StyledText>
          </>
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

        {isLoading && !roster ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={buttonColor} />
          </View>
        ) : null}

        {rosterIsEmpty ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: cardColor, borderColor },
            ]}
          >
            <StyledText variant="headline">Floor is quiet</StyledText>
            <StyledText variant="body" color={iconMuted} style={styles.emptyCopy}>
              No floor staff are clocked in right now. Pull to refresh when
              shifts start.
            </StyledText>
          </View>
        ) : (
          FLOOR_WORK_AREA_SECTIONS.map((section) => (
            <FloorStaffAreaSection
              key={section.id}
              area={section.id}
              label={section.label}
              description={section.description}
              members={groupedStaff[section.id]}
            />
          ))
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
});
