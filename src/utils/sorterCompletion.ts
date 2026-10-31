import type { InboundShipmentDetail, InboundShipmentStatus } from "@/interfaces/sorter";

export function isReceivingClosed(status: InboundShipmentStatus): boolean {
  return status === "received" || status === "partial_received";
}

export function formatReceivingClosedStatus(status: InboundShipmentStatus): string {
  switch (status) {
    case "received":
      return "Receiving complete";
    case "partial_received":
      return "Partially received";
    default:
      return status;
  }
}

export function receivingProgress(shipment: InboundShipmentDetail) {
  const manifestTotal = shipment.manifest_lines.length;
  const manifestReceived = shipment.manifest_lines.filter(
    (line) => line.receipt_line_id !== null,
  ).length;
  const lineTotal = shipment.receipt_lines.length;
  const linesStored = shipment.receipt_lines.filter(
    (line) => line.stage === "stored",
  ).length;

  return {
    manifestReceived,
    manifestTotal,
    linesStored,
    lineTotal,
  };
}

export function canCompleteReceiving(shipment: InboundShipmentDetail): boolean {
  if (shipment.status !== "receiving") {
    return false;
  }
  if (shipment.manifest_lines.length === 0) {
    return false;
  }

  const allManifestReceived = shipment.manifest_lines.every(
    (line) => line.receipt_line_id !== null,
  );
  if (!allManifestReceived) {
    return false;
  }
  if (shipment.receipt_lines.length === 0) {
    return false;
  }

  return shipment.receipt_lines.every((line) => line.stage === "stored");
}

export function completionBlockerMessage(shipment: InboundShipmentDetail): string | null {
  if (isReceivingClosed(shipment.status)) {
    return null;
  }
  if (shipment.status !== "receiving") {
    return null;
  }

  const progress = receivingProgress(shipment);
  if (progress.manifestReceived < progress.manifestTotal) {
    return `${progress.manifestTotal - progress.manifestReceived} manifest line(s) still need receiving.`;
  }
  if (progress.linesStored < progress.lineTotal) {
    return `${progress.lineTotal - progress.linesStored} receipt line(s) still need putaway.`;
  }
  return null;
}
