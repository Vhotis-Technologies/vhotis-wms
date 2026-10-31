import { StyleSheet, View } from "react-native";

import StyledText from "@/app/components/StyledText";
import { flatPanel, SORTER_BORDER } from "@/app/components/sorter/ui/sorterStyles";
import { formatShipmentStatus } from "@/constants/sorter";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { InboundShipmentDetail } from "@/interfaces/sorter";
import {
  formatReceivingClosedStatus,
  isReceivingClosed,
} from "@/utils/sorterCompletion";

interface ShipmentHeaderProps {
  shipment: InboundShipmentDetail;
}

function formatDelivery(method: InboundShipmentDetail["delivery_method"]) {
  return method === "seller_delivery" ? "Seller delivery" : "Vhotis collection";
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ShipmentHeader({ shipment }: ShipmentHeaderProps) {
  const iconMuted = useThemeColor({}, "icons");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const textColor = useThemeColor({}, "text");
  const bandForeground = useThemeColor({}, "background");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  const expected = formatDate(shipment.expected_arrival_at);
  const receivedAt = formatDate(shipment.received_at);
  const closed = isReceivingClosed(shipment.status);
  const statusColor =
    closed || shipment.status === "receiving"
      ? successColor
      : shipment.status === "arrived" ||
          shipment.status === "in_transit" ||
          shipment.status === "collection_dispatched"
        ? warningColor
        : iconMuted;

  const statusLabel = closed
    ? formatReceivingClosedStatus(shipment.status)
    : formatShipmentStatus(shipment.status);

  return (
    <View style={[styles.container, flatPanel, { borderColor, backgroundColor: cardColor }]}>
      <View style={[styles.titleBand, { backgroundColor: textColor }]}>
        <StyledText variant="eyebrow" style={[styles.titleBandText, { color: bandForeground }]}>
          INBOUND · DOCK
        </StyledText>
      </View>

      <View style={styles.body}>
        <StyledText variant="mono" color={successColor}>
          {shipment.id}
        </StyledText>
        <StyledText variant="display" style={styles.storeName}>
          {shipment.seller_store_name}
        </StyledText>
        <StyledText variant="body" color={iconMuted}>
          {formatDelivery(shipment.delivery_method)} · {shipment.warehouse_name}
        </StyledText>

        <View style={[styles.statusRow, { borderColor }]}>
          <View style={[styles.statusStripe, { backgroundColor: statusColor }]} />
          <StyledText variant="label" color={statusColor} style={styles.statusText}>
            {statusLabel.toUpperCase()}
          </StyledText>
        </View>

        {expected && !closed ? (
          <View style={[styles.metaBlock, { borderTopColor: borderColor }]}>
            <StyledText variant="eyebrow" color={iconMuted}>
              EXPECTED
            </StyledText>
            <StyledText variant="bodyMedium">{expected}</StyledText>
          </View>
        ) : null}

        {receivedAt && closed ? (
          <View style={[styles.metaBlock, { borderTopColor: borderColor }]}>
            <StyledText variant="eyebrow" color={iconMuted}>
              CLOSED
            </StyledText>
            <StyledText variant="bodyMedium">{receivedAt}</StyledText>
          </View>
        ) : null}

        {shipment.reference_notes ? (
          <View style={[styles.notesBlock, { borderColor, backgroundColor: `${warningColor}12` }]}>
            <StyledText variant="eyebrow" color={iconMuted}>
              NOTES
            </StyledText>
            <StyledText variant="caption" color={iconMuted}>
              {shipment.reference_notes}
            </StyledText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginBottom: 12,
  },
  titleBand: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  titleBandText: {
    letterSpacing: 1.4,
  },
  body: {
    padding: 14,
    gap: 8,
  },
  storeName: {
    fontSize: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: SORTER_BORDER,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusStripe: {
    width: 4,
    height: 20,
  },
  statusText: {
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  metaBlock: {
    borderTopWidth: SORTER_BORDER,
    paddingTop: 10,
    gap: 4,
  },
  notesBlock: {
    borderWidth: SORTER_BORDER,
    padding: 12,
    gap: 6,
  },
});
