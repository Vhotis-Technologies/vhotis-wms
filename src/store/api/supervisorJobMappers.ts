import type { ZoneBadge } from "@/interfaces/picker";
import type {
  SupervisorJobSegment,
  SupervisorJobSummary,
} from "@/interfaces/supervisor";

type SupervisorJobRecord = {
  id: string;
  order_id: string;
  store_name: string;
  status: string;
  segment: SupervisorJobSegment;
  pack_status: string;
  item_count: number;
  zones?: string[];
  has_pending_exceptions: boolean;
  pending_exception_count: number;
  assigned_picker_id: number | null;
  assigned_picker_name?: string;
  assigned_packer_id: number | null;
  assigned_packer_name?: string;
  units_verified: number;
  units_required: number;
  reserved_at: string | null;
  picking_started_at: string | null;
  packed_at: string | null;
  updated_at: string;
};

const ZONE_BADGES: ZoneBadge[] = ["AMB", "FRZ", "CHL"];

function mapZones(values: string[] | undefined): ZoneBadge[] {
  if (!values?.length) {
    return ["AMB"];
  }
  const mapped = values
    .filter((value): value is ZoneBadge =>
      ZONE_BADGES.includes(value as ZoneBadge),
    )
    .filter((value, index, array) => array.indexOf(value) === index);
  return mapped.length > 0 ? mapped : ["AMB"];
}

export function mapSupervisorJobSummary(
  record: SupervisorJobRecord,
): SupervisorJobSummary {
  return {
    id: record.id,
    orderId: record.order_id,
    storeName: record.store_name,
    status: record.status,
    segment: record.segment,
    packStatus: record.pack_status,
    itemCount: record.item_count,
    zones: mapZones(record.zones),
    hasPendingExceptions: record.has_pending_exceptions,
    pendingExceptionCount: record.pending_exception_count,
    assignedPickerId: record.assigned_picker_id,
    assignedPickerName: record.assigned_picker_name ?? "",
    assignedPackerId: record.assigned_packer_id,
    assignedPackerName: record.assigned_packer_name ?? "",
    unitsVerified: record.units_verified,
    unitsRequired: record.units_required,
    reservedAt: record.reserved_at,
    pickingStartedAt: record.picking_started_at,
    packedAt: record.packed_at,
    updatedAt: record.updated_at,
  };
}

export function mapSupervisorJobSummaries(
  records: SupervisorJobRecord[],
): SupervisorJobSummary[] {
  return records.map(mapSupervisorJobSummary);
}
