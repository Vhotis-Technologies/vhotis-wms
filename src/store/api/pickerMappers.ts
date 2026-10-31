import type {
  FulfillmentPickLineStatus,
  PickJobDetail,
  PickJobSummary,
  PickLine,
  PickScanResult,
  PickScanType,
  ZoneBadge,
} from "@/interfaces/picker";
import { syncPickLineStatuses } from "@/utils/pickerScan";
import { isPickJobReadyForPack } from "@/utils/pickerJob";

type RawPickLine = {
  id: number;
  product_name?: string;
  seller_sku?: string;
  location_code?: string | null;
  location_detail?: string;
  quantity_required: number;
  quantity_picked: number;
  status?: string;
  zone?: string;
  requires_container?: boolean;
  expected_container_code?: string | null;
  reserved_unit_codes?: string[];
  has_pending_exception?: boolean;
  last_scan_type?: string | null;
  last_picked_unit_code?: string | null;
};

type RawFulfillmentRequest = {
  id: string;
  order_id?: string;
  order_id_display?: string;
  store_name?: string;
  seller_email?: string;
  item_count?: number;
  zones?: string[];
  status: string;
  pick_lines?: RawPickLine[];
  reserved_at?: string | null;
  assigned_picker?: number | null;
};

type RawPickScanResponse = {
  pick_line_id: number;
  scan_type: string;
  unit_picked: boolean;
  unit_code: string | null;
  quantity_picked: number;
  quantity_required: number;
  line_complete: boolean;
  job_complete: boolean;
  fulfillment_request: RawFulfillmentRequest;
};

const ZONE_BADGES: ZoneBadge[] = ["AMB", "FRZ", "CHL"];

function mapZone(value: string | undefined): ZoneBadge {
  if (value && ZONE_BADGES.includes(value as ZoneBadge)) {
    return value as ZoneBadge;
  }
  return "AMB";
}

function mapZones(values: string[] | undefined): ZoneBadge[] {
  if (!values?.length) {
    return ["AMB"];
  }
  const mapped = values
    .map((value) => mapZone(value))
    .filter((value, index, array) => array.indexOf(value) === index);
  return mapped.length > 0 ? mapped : ["AMB"];
}

function mapScanType(value: string | null | undefined): PickScanType | null {
  if (value === "location" || value === "container" || value === "unit") {
    return value;
  }
  if (value === "pick_location") return "location";
  if (value === "pick_container") return "container";
  if (value === "pick_unit") return "unit";
  return null;
}

function mapLineStatus(value: string | undefined): FulfillmentPickLineStatus {
  if (
    value === "pending" ||
    value === "picked" ||
    value === "short" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending";
}

function mapPickLine(raw: RawPickLine): PickLine {
  const lineStatus = mapLineStatus(raw.status);
  return {
    id: raw.id,
    product_name: raw.product_name ?? "Product",
    sku: raw.seller_sku ?? "",
    location_code: raw.location_code ?? "",
    location_detail: raw.location_detail ?? raw.location_code ?? "",
    quantity_required: raw.quantity_required,
    quantity_picked: raw.quantity_picked,
    line_status: lineStatus,
    status: "pending",
    zone: mapZone(raw.zone),
    requires_container: Boolean(raw.requires_container),
    expected_container_code: raw.expected_container_code ?? null,
    reserved_unit_codes: raw.reserved_unit_codes ?? [],
    has_pending_exception: Boolean(raw.has_pending_exception),
    last_scan_type: mapScanType(raw.last_scan_type),
    last_picked_unit_code: raw.last_picked_unit_code ?? null,
  };
}

function mapJobStatus(value: string): PickJobSummary["status"] {
  return value === "picking" ? "picking" : "reserved";
}

export function mapPickJobDetail(raw: RawFulfillmentRequest): PickJobDetail {
  const pickLines = syncPickLineStatuses(
    (raw.pick_lines ?? []).map((line) => mapPickLine(line)),
  );

  return {
    id: raw.id,
    order_id: raw.order_id ?? raw.order_id_display ?? raw.id,
    store_name: raw.store_name ?? raw.seller_email ?? "Store",
    item_count: raw.item_count ?? pickLines.length,
    zones: mapZones(raw.zones),
    priority: false,
    estimated_minutes: null,
    status: mapJobStatus(raw.status),
    assigned_picker_id: raw.assigned_picker ?? null,
    pick_lines: pickLines,
  };
}

export function mapPickJobSummary(raw: RawFulfillmentRequest): PickJobSummary {
  return pickJobDetailToSummary(mapPickJobDetail(raw));
}

export function pickJobDetailToSummary(detail: PickJobDetail): PickJobSummary {
  return {
    id: detail.id,
    order_id: detail.order_id,
    store_name: detail.store_name,
    item_count: detail.item_count,
    zones: detail.zones,
    priority: detail.priority,
    estimated_minutes: detail.estimated_minutes,
    status: detail.status,
    assigned_picker_id: detail.assigned_picker_id ?? null,
  };
}

export function shouldIncludeInPickQueue(job: PickJobDetail): boolean {
  return !isPickJobReadyForPack(job);
}

export function mapPickScanResult(raw: RawPickScanResponse): PickScanResult {
  return {
    pick_line_id: raw.pick_line_id,
    scan_type: mapScanType(raw.scan_type) ?? "location",
    unit_picked: raw.unit_picked,
    unit_code: raw.unit_code,
    quantity_picked: raw.quantity_picked,
    quantity_required: raw.quantity_required,
    line_complete: raw.line_complete,
    job_complete: raw.job_complete,
    fulfillment_request: mapPickJobDetail(raw.fulfillment_request),
  };
}
