export type ZoneBadge = "AMB" | "FRZ" | "CHL";

export type PickLineStatus = "completed" | "active" | "pending" | "blocked";

/** Server-side FulfillmentPickLine.status */
export type FulfillmentPickLineStatus =
  | "pending"
  | "picked"
  | "short"
  | "cancelled";

export type PickScanType = "location" | "container" | "unit";

export type PickUiStep = "overview" | "scan" | "confirmed";

export type PickExceptionType =
  | "short_pick"
  | "location_empty"
  | "wrong_product"
  | "damaged_stock"
  | "label_unreadable"
  | "product_mismatch"
  | "other";

export interface PickLine {
  id: number;
  product_name: string;
  sku: string;
  location_code: string;
  location_detail: string;
  quantity_required: number;
  quantity_picked: number;
  line_status: FulfillmentPickLineStatus;
  status: PickLineStatus;
  zone: ZoneBadge;
  requires_container: boolean;
  expected_container_code: string | null;
  reserved_unit_codes: string[];
  has_pending_exception: boolean;
  last_scan_type: PickScanType | null;
  last_picked_unit_code: string | null;
}

export interface PickJobSummary {
  id: string;
  order_id: string;
  store_name: string;
  item_count: number;
  zones: ZoneBadge[];
  priority: boolean;
  estimated_minutes: number | null;
  status: "reserved" | "picking";
  assigned_picker_id?: number | null;
}

export interface PickJobDetail extends PickJobSummary {
  pick_lines: PickLine[];
}

export interface PickerDashboardStats {
  pickedToday: number;
  inQueue: number;
  accuracy: number;
}

export interface PickScanResult {
  pick_line_id: number;
  scan_type: PickScanType;
  unit_picked: boolean;
  unit_code: string | null;
  quantity_picked: number;
  quantity_required: number;
  line_complete: boolean;
  job_complete: boolean;
  fulfillment_request: PickJobDetail;
}

export interface SubmitPickScanParams {
  jobId: string;
  pickLineId: number;
  pickerId: number;
  warehouseId: number;
  scanType: PickScanType;
  payload: string;
}

export interface RaiseShortPickParams {
  pickLineId: number;
  pickerId: number;
  exceptionType: PickExceptionType;
  quantityFound?: number;
  notes?: string;
  photoUrls?: string[];
  photos?: PickExceptionPhotoDraft[];
}

export interface PickExceptionPhotoDraft {
  uri: string;
  fileName?: string;
  mimeType?: string;
}
