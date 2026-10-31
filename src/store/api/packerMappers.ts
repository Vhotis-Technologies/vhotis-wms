import type { ZoneBadge } from "@/interfaces/picker";
import type {
  BoxSpec,
  PackJobDetail,
  PackJobStatus,
  PackJobSummary,
  PackLabel,
  PackLine,
  PackScanResult,
  PackerDashboardStats,
} from "@/interfaces/packer";
import { syncPackLineStatuses } from "@/utils/packScan";

type RawPackLine = {
  id: number;
  product_name?: string;
  location_code?: string;
  zone?: string;
  quantity_required: number;
  quantity_verified: number;
  unit_codes?: string[];
  verified_unit_codes?: string[];
};

type RawBoxSpec = {
  box_size?: string;
  total_weight?: string;
  cold_pack?: string;
  seal_type?: string;
};

type RawPackLabel = {
  label_code?: string;
  deliver_to_name?: string;
  deliver_to_address?: string;
  items_summary?: string;
  special_notes?: string | null;
  packed_by?: string;
  packed_at?: string | null;
};

type RawFulfillmentRequest = {
  id: string;
  order_id?: string;
  order_id_display?: string;
  store_name?: string;
  item_count?: number;
  box_hint?: string;
  station_label?: string;
  pack_status?: string;
  status?: string;
  pack_lines?: RawPackLine[];
  units_verified?: number;
  units_required?: number;
  box_spec?: RawBoxSpec;
  label?: RawPackLabel;
  label_printed?: boolean;
  label_linked?: boolean;
  assigned_packer?: number | null;
};

type RawPackScanResponse = {
  fulfillment_request_id: string;
  unit_code: string;
  units_packed: number;
  units_required: number;
  pack_complete: boolean;
  fulfillment_request?: RawFulfillmentRequest;
};

const ZONE_BADGES: ZoneBadge[] = ["AMB", "FRZ", "CHL"];

function mapZone(value: string | undefined): ZoneBadge {
  if (value && ZONE_BADGES.includes(value as ZoneBadge)) {
    return value as ZoneBadge;
  }
  return "AMB";
}

function mapPackStatus(raw: RawFulfillmentRequest): PackJobStatus {
  const value = raw.pack_status ?? raw.status ?? "ready";
  if (
    value === "ready" ||
    value === "packing" ||
    value === "packed" ||
    value === "ready_for_dispatch"
  ) {
    return value;
  }
  if (value === "picking") {
    return (raw.units_verified ?? 0) > 0 ? "packing" : "ready";
  }
  if (value === "packed") {
    return "packed";
  }
  return "ready";
}

function mapPackLine(raw: RawPackLine): PackLine {
  return {
    id: raw.id,
    product_name: raw.product_name ?? "Product",
    location_code: raw.location_code ?? "",
    zone: mapZone(raw.zone),
    quantity_required: raw.quantity_required,
    quantity_verified: raw.quantity_verified,
    unit_codes: raw.unit_codes ?? [],
    verified_unit_codes: raw.verified_unit_codes ?? [],
    status: "pending",
  };
}

function mapBoxSpec(raw: RawBoxSpec | undefined): BoxSpec {
  return {
    box_size: raw?.box_size ?? "Medium",
    total_weight: raw?.total_weight ?? "Weigh at station",
    cold_pack: raw?.cold_pack ?? "None",
    seal_type: raw?.seal_type ?? "Standard",
  };
}

function mapPackLabel(raw: RawPackLabel | undefined, jobId: string): PackLabel {
  return {
    label_code: raw?.label_code ?? jobId,
    deliver_to_name: raw?.deliver_to_name ?? "Customer",
    deliver_to_address: raw?.deliver_to_address ?? "—",
    items_summary: raw?.items_summary ?? "Items pending verify",
    special_notes: raw?.special_notes ?? null,
    packed_by: raw?.packed_by ?? "Pack station",
    packed_at: raw?.packed_at ?? null,
  };
}

export function mapPackJobDetail(raw: RawFulfillmentRequest): PackJobDetail {
  const packLines = syncPackLineStatuses(
    (raw.pack_lines ?? []).map((line) => mapPackLine(line)),
  );

  return {
    id: raw.id,
    order_id: raw.order_id ?? raw.order_id_display ?? raw.id,
    store_name: raw.store_name ?? "Store",
    item_count: raw.item_count ?? packLines.length,
    box_hint: raw.box_hint ?? "Ambient box",
    station_label: raw.station_label ?? "Pack station",
    status: mapPackStatus(raw),
    pack_lines: packLines,
    box_spec: mapBoxSpec(raw.box_spec),
    label: mapPackLabel(raw.label, raw.id),
    label_printed: Boolean(raw.label_printed),
    label_linked: Boolean(raw.label_linked),
    units_verified: raw.units_verified ?? 0,
    units_required: raw.units_required ?? 0,
    assigned_packer_id: raw.assigned_packer ?? null,
  };
}

export function mapPackJobSummary(raw: RawFulfillmentRequest): PackJobSummary {
  const detail = mapPackJobDetail(raw);
  return {
    id: detail.id,
    order_id: detail.order_id,
    store_name: detail.store_name,
    item_count: detail.item_count,
    box_hint: detail.box_hint,
    station_label: detail.station_label,
    status: detail.status,
    assigned_packer_id: detail.assigned_packer_id ?? null,
  };
}

export function packJobDetailToSummary(detail: PackJobDetail): PackJobSummary {
  return {
    id: detail.id,
    order_id: detail.order_id,
    store_name: detail.store_name,
    item_count: detail.item_count,
    box_hint: detail.box_hint,
    station_label: detail.station_label,
    status: detail.status,
    assigned_packer_id: detail.assigned_packer_id ?? null,
  };
}

export function mapPackScanResult(
  raw: RawPackScanResponse,
  job: PackJobDetail,
): PackScanResult {
  return {
    fulfillment_request_id: raw.fulfillment_request_id,
    unit_code: raw.unit_code,
    units_packed: raw.units_packed,
    units_required: raw.units_required,
    pack_complete: raw.pack_complete,
    job: raw.fulfillment_request
      ? mapPackJobDetail(raw.fulfillment_request)
      : job,
  };
}

type RawPackerStats = {
  packed_today?: number;
  in_queue?: number;
  accuracy?: number;
};

export function mapPackerStats(raw: RawPackerStats): PackerDashboardStats {
  return {
    packedToday: raw.packed_today ?? 0,
    inQueue: raw.in_queue ?? 0,
    accuracy: raw.accuracy ?? 0,
  };
}

export { shouldIncludeInPackQueue } from "@/utils/packJob";
