import type {
  ResolvedLocationScan,
  SupervisorRelocateLocation,
} from "@/interfaces/supervisor";
import type { ZoneBadge } from "@/interfaces/picker";

type RelocateLocationRecord = {
  id: number;
  code: string;
  location_type: string;
  zone?: ZoneBadge;
  location_detail?: string;
  available_quantity: number;
};

type ResolvedScanRecord = {
  kind: string;
  location_id?: number | null;
  location?: {
    id: number;
    code: string;
    temperature_zone?: string;
    zone?: string;
    aisle?: string;
    rack?: string;
    bin?: string;
  } | null;
  location_code?: string | null;
  location_detail?: string;
  zone?: ZoneBadge;
};

function buildLocationDetailFromParts(location: NonNullable<ResolvedScanRecord["location"]>): string {
  const zoneLabel =
    location.temperature_zone === "cold"
      ? "Chilled"
      : location.temperature_zone === "frozen"
        ? "Frozen"
        : "Ambient";
  const parts = [zoneLabel];
  if (location.aisle) {
    parts.push(`Aisle ${location.aisle}`);
  }
  if (location.rack) {
    parts.push(`Bay ${location.rack}`);
  }
  if (location.bin) {
    parts.push(`Level ${location.bin}`);
  }
  if (parts.length === 1) {
    parts.push(location.code);
  }
  return parts.join(" · ");
}

export function mapRelocateLocation(
  record: RelocateLocationRecord,
): SupervisorRelocateLocation {
  return {
    id: record.id,
    code: record.code,
    locationType: record.location_type,
    zone: record.zone === "CHL" || record.zone === "FRZ" ? record.zone : "AMB",
    locationDetail: record.location_detail ?? record.code,
    availableQuantity: record.available_quantity,
  };
}

export function mapRelocateLocations(
  records: RelocateLocationRecord[],
): SupervisorRelocateLocation[] {
  return records.map(mapRelocateLocation);
}

export function mapResolvedLocationScan(
  record: ResolvedScanRecord,
): ResolvedLocationScan | null {
  if (record.kind !== "location") {
    return null;
  }

  const locationId = record.location_id ?? record.location?.id;
  const code = record.location?.code ?? record.location_code ?? "";
  if (!locationId || !code) {
    return null;
  }

  const zone =
    record.zone === "CHL" || record.zone === "FRZ"
      ? record.zone
      : record.location?.temperature_zone === "cold"
        ? "CHL"
        : record.location?.temperature_zone === "frozen"
          ? "FRZ"
          : "AMB";

  return {
    locationId,
    code,
    locationDetail:
      record.location_detail ??
      (record.location ? buildLocationDetailFromParts(record.location) : code),
    zone,
  };
}
