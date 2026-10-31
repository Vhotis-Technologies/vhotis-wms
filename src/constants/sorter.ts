import type { InboundShipmentStatus } from "@/interfaces/sorter";

/** Shipment statuses shown on the sorter inbound queue. */
export const INBOUND_QUEUE_STATUSES: InboundShipmentStatus[] = [
  "scheduled",
  "collection_dispatched",
  "in_transit",
  "arrived",
  "receiving",
];

/** Statuses where dock staff can mark arrival and begin receiving. */
export const ARRIVABLE_SHIPMENT_STATUSES: InboundShipmentStatus[] = [
  "scheduled",
  "collection_dispatched",
  "in_transit",
  "arrived",
];

export function isArrivableShipmentStatus(status: InboundShipmentStatus): boolean {
  return ARRIVABLE_SHIPMENT_STATUSES.includes(status);
}

export function formatDockLabel(warehouseCode?: string | null): string {
  if (warehouseCode) {
    return `Inbound dock · ${warehouseCode}`;
  }
  return "Inbound dock";
}

export function formatShipmentStatus(status: InboundShipmentStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "collection_dispatched":
      return "Collection dispatched";
    case "in_transit":
      return "In transit";
    case "arrived":
      return "Arrived";
    case "receiving":
      return "Receiving";
    case "received":
      return "Received";
    case "partial_received":
      return "Partially received";
    default:
      return status;
  }
}
