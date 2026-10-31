import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import ZoneBadge from "@/app/components/shared/ZoneBadge";
import {
  supervisorDamageClaimDetailHref,
  supervisorJobDetailHref,
  supervisorRecountTaskHref,
} from "@/constants/supervisor";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PickExceptionSummary } from "@/interfaces/supervisor";
import { formatExceptionAge } from "@/utils/supervisorExceptions";

interface ExceptionContextCardProps {
  exception: PickExceptionSummary;
}

function formatPickLineStatus(
  status: PickExceptionSummary["pickLineStatus"],
): string {
  switch (status) {
    case "picked":
      return "Picked";
    case "short":
      return "Short";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export default function ExceptionContextCard({
  exception,
}: ExceptionContextCardProps) {
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconMuted = useThemeColor({}, "icons");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");
  const buttonColor = useThemeColor({}, "button");

  const waitColor = exception.isStale ? errorColor : warningColor;

  return (
    <View
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
    >
      <View style={styles.headerRow}>
        <StyledText variant="monoSmall" color={successColor}>
          {exception.fulfillmentRequestId}
        </StyledText>
        <View
          style={[styles.waitBadge, { backgroundColor: `${waitColor}18` }]}
        >
          <StyledText variant="caption" color={waitColor}>
            {formatExceptionAge(exception.ageMinutes)}
          </StyledText>
        </View>
      </View>

      {exception.orderId ? (
        <StyledText variant="label" color={iconMuted}>
          Order {exception.orderId}
        </StyledText>
      ) : null}

      <StyledText variant="headline">{exception.exceptionLabel}</StyledText>
      <StyledText variant="bodyMedium">{exception.productName}</StyledText>

      {exception.sku ? (
        <StyledText variant="monoSmall" color={iconMuted}>
          {exception.sku}
        </StyledText>
      ) : null}

      <StyledText variant="body" color={iconMuted} style={styles.location}>
        {exception.locationDetail}
      </StyledText>

      <View style={styles.metaRow}>
        <ZoneBadge zone={exception.zone} />
        <StyledText variant="caption" color={iconMuted}>
          Raised by {exception.raisedByName}
        </StyledText>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Required
          </StyledText>
          <StyledText variant="bodyMedium">
            {exception.quantityRequired}
          </StyledText>
        </View>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Found
          </StyledText>
          <StyledText variant="bodyMedium">{exception.quantityFound}</StyledText>
        </View>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Picked
          </StyledText>
          <StyledText variant="bodyMedium">{exception.quantityPicked}</StyledText>
        </View>
        <View style={styles.statCell}>
          <StyledText variant="caption" color={iconMuted}>
            Line status
          </StyledText>
          <StyledText variant="bodyMedium">
            {formatPickLineStatus(exception.pickLineStatus)}
          </StyledText>
        </View>
      </View>

      {exception.pickerNotes ? (
        <View style={[styles.notesBox, { borderColor }]}>
          <StyledText variant="label" color={iconMuted}>
            Picker notes
          </StyledText>
          <StyledText variant="body">{exception.pickerNotes}</StyledText>
        </View>
      ) : null}

      <Pressable
        onPress={() =>
          router.push(
            supervisorJobDetailHref(exception.fulfillmentRequestId) as Href,
          )
        }
        style={styles.jobLink}
      >
        <StyledText variant="label" color={buttonColor}>
          View full job →
        </StyledText>
      </Pressable>

      {!exception.isPending && exception.recountPending ? (
        <Pressable
          onPress={() =>
            router.push(supervisorRecountTaskHref(exception.id) as Href)
          }
          style={styles.jobLink}
        >
          <StyledText variant="label" color={warningColor}>
            Complete recount task →
          </StyledText>
        </Pressable>
      ) : null}

      {exception.damageClaimPending && exception.linkedDamageClaimId != null ? (
        <Pressable
          onPress={() =>
            router.push(
              supervisorDamageClaimDetailHref(
                exception.linkedDamageClaimId as number,
              ) as Href,
            )
          }
          style={styles.jobLink}
        >
          <StyledText variant="label" color={errorColor}>
            Review damage claim →
          </StyledText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
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
  location: {
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  statCell: {
    minWidth: "42%",
    gap: 2,
  },
  notesBox: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  jobLink: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
});
