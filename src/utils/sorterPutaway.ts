import type { ZoneBadge } from "@/interfaces/picker";
import type { ReceiptLineDetail, SortUiStep } from "@/interfaces/sorter";

export function zoneStorageLabel(zone: ZoneBadge): string {
  switch (zone) {
    case "FRZ":
      return "Frozen storage zone";
    case "CHL":
      return "Chilled storage zone";
    default:
      return "Ambient storage zone";
  }
}

export function zoneDisplayCode(zone: ZoneBadge): string {
  switch (zone) {
    case "FRZ":
      return "FRZ zone";
    case "CHL":
      return "CHL zone";
    default:
      return "AMB zone";
  }
}

export function putawayZoneLabel(zone: ZoneBadge): string {
  switch (zone) {
    case "FRZ":
      return "Frozen (FRZ)";
    case "CHL":
      return "Chilled (CHL)";
    default:
      return "Ambient (AMB)";
  }
}

export function hasSuggestedBin(line: ReceiptLineDetail): boolean {
  return Boolean(line.suggested_location?.trim());
}

export function locationScanFormatExamples(warehouseCode?: string | null): string {
  const wh = warehouseCode?.trim() || "WH";
  return `LOC:${wh}:A-01-02 or ${wh}:A-01-02`;
}

export function putawayGuidanceSectionLabel(line: ReceiptLineDetail): string {
  return hasSuggestedBin(line) ? "SUGGESTED BIN" : "TEMPERATURE ZONE";
}

export function putawayGuidanceHeadline(line: ReceiptLineDetail): string {
  if (hasSuggestedBin(line)) {
    return line.suggested_location;
  }
  return line.zone;
}

export function putawayGuidanceDetail(
  line: ReceiptLineDetail,
  target: ReturnType<typeof getActivePutawayTarget>,
  activeContainerCode?: string | null,
): string {
  const zoneLabel = putawayZoneLabel(line.zone);

  if (hasSuggestedBin(line)) {
    if (target?.type === "container") {
      const carton = activeContainerCode ?? target.code;
      return `${zoneLabel} · put away carton ${carton} at this bin`;
    }
    if (target?.type === "unit") {
      return `${zoneLabel} · put away unit ${target.code} at this bin`;
    }
    return `${zoneLabel} · scan the bin label shown above`;
  }

  if (target?.type === "container") {
    const carton = activeContainerCode ?? target.code;
    return `${zoneLabel} · find a bin in this zone for carton ${carton}`;
  }
  if (target?.type === "unit") {
    return `${zoneLabel} · find a bin in this zone for unit ${target.code}`;
  }
  return `${zoneLabel} · choose any empty bin in this zone`;
}

export function putawayScanPrompt(
  target: ReturnType<typeof getActivePutawayTarget>,
  activeContainerCode?: string | null,
): string {
  if (target?.type === "container") {
    const carton = activeContainerCode ?? target.code;
    return `Scan the bin label for carton ${carton}`;
  }
  if (target?.type === "unit") {
    return `Scan the bin label where unit ${target.code} is going`;
  }
  return "Scan the bin or shelf label";
}

export function putawayScanDetail(
  line: ReceiptLineDetail,
  warehouseCode?: string | null,
): string {
  const zoneLabel = putawayZoneLabel(line.zone);
  const format = locationScanFormatExamples(warehouseCode);
  if (hasSuggestedBin(line)) {
    return `${zoneLabel} required · confirm with bin label (${format})`;
  }
  return `${zoneLabel} required · scan any valid bin label, e.g. ${format}`;
}

export function putawayViewportPrompt(): string {
  return "Point camera at bin shelf label";
}

export function putawayStockBeingStoredLabel(
  target: ReturnType<typeof getActivePutawayTarget>,
  activeContainerCode?: string | null,
): string | null {
  if (target?.type === "container") {
    return `Storing carton: ${activeContainerCode ?? target.code}`;
  }
  if (target?.type === "unit") {
    return `Storing unit: ${target.code}`;
  }
  return null;
}

export function containerScanPrompt(
  target: ReturnType<typeof getActivePutawayTarget>,
): string {
  if (target?.type === "container") {
    return `Scan carton label ${target.code}`;
  }
  return "Scan carton barcode";
}

export function containerScanDetail(remainingUnits: number): string {
  return `Boxed stock · ${remainingUnits} unit(s) still to put away after this carton`;
}

export function getActivePutawayTarget(
  line: ReceiptLineDetail,
  activeContainerCode?: string | null,
): {
  type: "unit" | "container";
  code: string;
} | null {
  if (line.packaging_mode === "boxed") {
    if (activeContainerCode) {
      const active = line.storage_containers.find(
        (container) => container.container_code === activeContainerCode,
      );
      if (active && active.status !== "stored" && active.verified) {
        return { type: "container", code: active.container_code };
      }
    }
    const container = line.storage_containers.find(
      (entry) => entry.status !== "stored" && entry.verified,
    );
    if (container) {
      return { type: "container", code: container.container_code };
    }
    return null;
  }

  const unit = line.stock_units.find(
    (entry) => entry.status === "received" && entry.verified,
  );
  if (unit) {
    return { type: "unit", code: unit.unit_code };
  }
  return null;
}

export function resolveNextPutawayStep(line: ReceiptLineDetail): SortUiStep {
  if (line.units_stored >= line.accepted_quantity && line.accepted_quantity > 0) {
    return "confirmed";
  }

  const pendingVerify = line.stock_units.some(
    (unit) => unit.status === "received" && !unit.verified,
  );
  if (pendingVerify) {
    return "verify";
  }

  if (line.packaging_mode === "boxed") {
    const nextContainer = line.storage_containers.find(
      (container) => container.status !== "stored" && container.verified,
    );
    return nextContainer ? "container" : "overview";
  }

  const pendingUnit = line.stock_units.some(
    (unit) => unit.status === "received" && unit.verified,
  );
  return pendingUnit ? "putaway" : "overview";
}

export function putawayLocationHeadline(line: ReceiptLineDetail): string {
  if (hasSuggestedBin(line)) {
    return line.suggested_location;
  }
  return putawayZoneLabel(line.zone);
}

export function putawayLocationDetail(
  line: ReceiptLineDetail,
  target: ReturnType<typeof getActivePutawayTarget>,
  activeContainerCode?: string | null,
): string {
  return putawayGuidanceDetail(line, target, activeContainerCode);
}

export function remainingPutawayCount(line: ReceiptLineDetail): number {
  return Math.max(line.accepted_quantity - line.units_stored, 0);
}
