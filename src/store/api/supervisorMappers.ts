import { formatPickExceptionLabel } from "@/constants/picker";
import type { ZoneBadge } from "@/interfaces/picker";
import type {
  PickExceptionRecord,
  PickExceptionSummary,
} from "@/interfaces/supervisor";
import { STALE_EXCEPTION_MINUTES } from "@/utils/supervisorExceptions";

function resolveZone(record: PickExceptionRecord): ZoneBadge {
  if (record.zone === "CHL" || record.zone === "FRZ") {
    return record.zone;
  }
  return "AMB";
}

function resolveAgeMinutes(record: PickExceptionRecord): number {
  if (typeof record.age_minutes === "number") {
    return Math.max(0, record.age_minutes);
  }
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(record.raised_at).getTime()) / 60_000),
  );
}

function resolvePickLineStatus(
  record: PickExceptionRecord,
): PickExceptionSummary["pickLineStatus"] {
  const status = record.pick_line_status;
  if (
    status === "picked" ||
    status === "short" ||
    status === "cancelled" ||
    status === "pending"
  ) {
    return status;
  }
  return "pending";
}

export function mapPickExceptionSummary(
  record: PickExceptionRecord,
): PickExceptionSummary {
  const photoUrls = record.photo_urls ?? [];
  const ageMinutes = resolveAgeMinutes(record);
  const isPending = record.resolution === "pending";

  return {
    id: record.id,
    pickLineId: record.pick_line_id,
    fulfillmentRequestId: record.fulfillment_request_id,
    orderId: record.order_id ?? "",
    exceptionType: record.exception_type,
    exceptionLabel: formatPickExceptionLabel(record.exception_type),
    productName: record.product_name ?? "Unknown product",
    sku: record.seller_sku ?? "",
    locationCode: record.location_code ?? "—",
    locationDetail: record.location_detail ?? record.location_code ?? "—",
    zone: resolveZone(record),
    raisedByEmployeeId: record.raised_by_employee_id,
    raisedByName: record.raised_by_name ?? record.raised_by_employee_id,
    raisedAt: record.raised_at,
    ageMinutes,
    isStale: isPending && ageMinutes >= STALE_EXCEPTION_MINUTES,
    photoUrls,
    quantityFound: record.quantity_found,
    quantityRequired: record.quantity_required ?? 0,
    quantityPicked: record.quantity_picked ?? 0,
    pickLineStatus: resolvePickLineStatus(record),
    fulfillmentStatus: record.fulfillment_status ?? "",
    pickerNotes: isPending ? record.resolution_notes ?? "" : "",
    isPending,
    hasPhotos: photoUrls.length > 0,
    resolution: record.resolution,
    resolvedAt: record.resolved_at,
    resolvedByEmployeeId: record.resolved_by_employee_id,
    resolvedByName:
      record.resolved_by_name ??
      record.resolved_by_employee_id ??
      "",
    resolutionNotes: record.resolution_notes ?? "",
    recountPending: Boolean(record.recount_pending),
    linkedDamageClaimId: record.linked_damage_claim_id ?? null,
    damageClaimPending: Boolean(record.damage_claim_pending),
  };
}

export function mapPickExceptionSummaries(
  records: PickExceptionRecord[],
): PickExceptionSummary[] {
  return records.map(mapPickExceptionSummary);
}
