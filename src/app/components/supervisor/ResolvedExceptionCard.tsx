import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickExceptionSummary } from "@/interfaces/supervisor";
import { formatExceptionResolutionLabel } from "@/utils/supervisorResolution";

interface ResolvedExceptionCardProps {
  exception: PickExceptionSummary;
  onPress?: () => void;
}

function formatResolvedWhen(iso: string | null): string {
  if (!iso) {
    return "Resolved";
  }
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ResolvedExceptionCard({
  exception,
  onPress,
}: ResolvedExceptionCardProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor,
          opacity: onPress && pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="bodyMedium">{exception.exceptionLabel}</StyledText>
        <StyledText variant="caption" color={successColor}>
          {formatExceptionResolutionLabel(exception.resolution)}
        </StyledText>
      </View>
      <StyledText variant="caption" color={iconMuted}>
        {exception.fulfillmentRequestId} · {exception.productName}
      </StyledText>
      <StyledText variant="caption" color={iconMuted}>
        {exception.locationDetail}
      </StyledText>
      <StyledText variant="caption" color={iconMuted}>
        {formatResolvedWhen(exception.resolvedAt)}
        {exception.resolvedByName
          ? ` · ${exception.resolvedByName}`
          : ""}
      </StyledText>
      {exception.resolutionNotes ? (
        <StyledText variant="caption" color={iconMuted} style={styles.notes}>
          {exception.resolutionNotes}
        </StyledText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  notes: {
    marginTop: 2,
    lineHeight: 18,
  },
});
