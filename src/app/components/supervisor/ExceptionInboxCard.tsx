import { Image, Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import { formatExceptionAge } from "@/utils/supervisorExceptions";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickExceptionSummary } from "@/interfaces/supervisor";

interface ExceptionInboxCardProps {
  exception: PickExceptionSummary;
  onPress: () => void;
}

export default function ExceptionInboxCard({
  exception,
  onPress,
}: ExceptionInboxCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");

  const accentColor = exception.isStale ? errorColor : warningColor;
  const thumbnail = exception.photoUrls[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: exception.isStale ? `${errorColor}88` : borderColor,
          borderWidth: exception.isStale ? 1.5 : 1,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="monoSmall" color={successColor}>
          {exception.fulfillmentRequestId}
        </StyledText>
        <View
          style={[
            styles.waitBadge,
            { backgroundColor: `${accentColor}18` },
          ]}
        >
          <StyledText variant="caption" color={accentColor}>
            {formatExceptionAge(exception.ageMinutes)}
          </StyledText>
        </View>
      </View>

      <StyledText variant="headline" style={styles.title}>
        {exception.exceptionLabel}
      </StyledText>

      <StyledText variant="bodyMedium">{exception.productName}</StyledText>
      {exception.sku ? (
        <StyledText variant="monoSmall" color={iconMuted}>
          {exception.sku}
        </StyledText>
      ) : null}

      <StyledText variant="label" color={iconMuted} style={styles.location}>
        {exception.locationDetail}
      </StyledText>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <ZoneBadge zone={exception.zone} />
          <StyledText variant="caption" color={iconMuted}>
            {exception.raisedByName}
          </StyledText>
          {exception.quantityRequired > 0 ? (
            <StyledText variant="caption" color={iconMuted}>
              · found {exception.quantityFound}/{exception.quantityRequired}
            </StyledText>
          ) : null}
        </View>

        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  waitBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  title: {
    marginTop: 2,
  },
  location: {
    marginTop: 2,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  footerLeft: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#1a1a1a20",
  },
});
