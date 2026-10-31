import { type Href, router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import {
  supervisorExceptionDetailHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickExceptionSummary } from "@/interfaces/supervisor";
import { formatExceptionAge } from "@/utils/supervisorExceptions";
import { formatExceptionResolutionLabel } from "@/utils/supervisorResolution";

interface SupervisorExceptionHistoryListProps {
  pendingExceptions: PickExceptionSummary[];
  resolvedExceptions: PickExceptionSummary[];
  canOpenPending?: boolean;
}

function ExceptionHistoryRow({
  exception,
  onPress,
  showResolution = false,
}: {
  exception: PickExceptionSummary;
  onPress?: () => void;
  showResolution?: boolean;
}) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const buttonColor = useThemeColor({}, "button");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");

  const toneColor = exception.isPending
    ? exception.isStale
      ? errorColor
      : buttonColor
    : successColor;

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: cardColor,
          borderColor: exception.isPending ? toneColor : borderColor,
          opacity: onPress && pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.rowHeader}>
        <StyledText variant="bodyMedium">{exception.exceptionLabel}</StyledText>
        <StyledText variant="caption" color={toneColor}>
          {exception.isPending
            ? formatExceptionAge(exception.ageMinutes)
            : formatExceptionResolutionLabel(exception.resolution)}
        </StyledText>
      </View>
      <StyledText variant="caption" color={iconMuted}>
        {exception.productName} · {exception.locationCode}
      </StyledText>
      {showResolution && !exception.isPending ? (
        <StyledText variant="caption" color={iconMuted}>
          {exception.resolvedByName
            ? `Resolved by ${exception.resolvedByName}`
            : "Resolved"}
          {exception.resolutionNotes ? ` · ${exception.resolutionNotes}` : ""}
        </StyledText>
      ) : null}
      {onPress && exception.isPending ? (
        <StyledText variant="caption" color={buttonColor}>
          Open exception →
        </StyledText>
      ) : null}
    </Pressable>
  );
}

export default function SupervisorExceptionHistoryList({
  pendingExceptions,
  resolvedExceptions,
  canOpenPending = true,
}: SupervisorExceptionHistoryListProps) {
  const iconMuted = useThemeColor({}, "icons");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  if (pendingExceptions.length === 0 && resolvedExceptions.length === 0) {
    return (
      <View style={styles.emptyBlock}>
        <StyledText variant="label" color={iconMuted}>
          Exception history
        </StyledText>
        <StyledText variant="body" color={iconMuted}>
          No pick exceptions recorded for this job.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pendingExceptions.length > 0 ? (
        <View style={styles.section}>
          <StyledText variant="eyebrow" color={iconMuted}>
            OPEN EXCEPTIONS
          </StyledText>
          {pendingExceptions.map((exception) => (
            <ExceptionHistoryRow
              key={exception.id}
              exception={exception}
              onPress={
                canOpenPending
                  ? () =>
                      router.push(
                        supervisorExceptionDetailHref(exception.id) as Href,
                      )
                  : undefined
              }
            />
          ))}
        </View>
      ) : null}

      {resolvedExceptions.length > 0 ? (
        <View style={styles.section}>
          <Pressable
            onPress={() => setHistoryExpanded((value) => !value)}
            style={styles.historyToggle}
          >
            <StyledText variant="eyebrow" color={iconMuted}>
              RESOLVED HISTORY ({resolvedExceptions.length})
            </StyledText>
            <StyledText variant="caption" color={iconMuted}>
              {historyExpanded ? "Hide" : "Show"}
            </StyledText>
          </Pressable>
          {historyExpanded
            ? resolvedExceptions.map((exception) => (
                <ExceptionHistoryRow
                  key={exception.id}
                  exception={exception}
                  showResolution
                />
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  emptyBlock: {
    gap: 6,
  },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
});
