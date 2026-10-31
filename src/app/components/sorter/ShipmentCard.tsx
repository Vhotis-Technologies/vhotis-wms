import { Pressable, StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { SorterStatusStripe } from "@/app/components/sorter/ui/SorterLayout";
import { flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { formatShipmentStatus } from "@/constants/sorter";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { InboundShipmentSummary } from "@/interfaces/sorter";

interface ShipmentCardProps {
  shipment: InboundShipmentSummary;
  onPress?: () => void;
}

function formatDelivery(method: InboundShipmentSummary["delivery_method"]) {
  return method === "seller_delivery" ? "Seller delivery" : "Vhotis collection";
}

export default function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
  const iconMuted = useThemeColor({}, "icons");
  const cardColor = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  const statusColor =
    shipment.status === "receiving"
      ? successColor
      : shipment.status === "arrived" ||
          shipment.status === "in_transit" ||
          shipment.status === "collection_dispatched"
        ? warningColor
        : iconMuted;

  const weightLabel = shipment.total_declared_weight_kg
    ? `${shipment.total_declared_weight_kg} kg`
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, flatPanel, { backgroundColor: cardColor, borderColor }]}
    >
      <SorterStatusStripe color={statusColor} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <StyledText variant="monoSmall" color={successColor}>
            {shipment.id}
          </StyledText>
          <StyledText variant="caption" color={statusColor} style={styles.status}>
            {formatShipmentStatus(shipment.status).toUpperCase()}
          </StyledText>
        </View>
        <StyledText variant="headline">{shipment.seller_store_name}</StyledText>
        <View style={styles.metaRow}>
          <StyledText variant="caption" color={iconMuted}>
            {shipment.manifest_line_count} lines
          </StyledText>
          {weightLabel ? (
            <>
              <View style={[styles.metaDivider, { backgroundColor: borderColor }]} />
              <StyledText variant="caption" color={iconMuted}>
                {weightLabel}
              </StyledText>
            </>
          ) : null}
          <View style={[styles.metaDivider, { backgroundColor: borderColor }]} />
          <StyledText variant="caption" color={iconMuted}>
            {formatDelivery(shipment.delivery_method)}
          </StyledText>
        </View>
      </View>
      <View style={[styles.chevron, { borderLeftColor: borderColor }]}>
        <StyledText variant="label" color={iconMuted}>
          ›
        </StyledText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  status: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  metaDivider: {
    width: 1,
    height: 12,
  },
  chevron: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: SORTER_BORDER,
  },
});
