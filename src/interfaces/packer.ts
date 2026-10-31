import type { ZoneBadge } from "@/interfaces/picker";

export type PackLineStatus = "pending" | "active" | "verified";

export type PackUiStep =
  | "overview"
  | "verify"
  | "labelReady"
  | "labelScan"
  | "dispatch";

export type PackJobStatus =
  | "ready"
  | "packing"
  | "packed"
  | "ready_for_dispatch";

export interface PackUnit {
  unit_code: string;
  verified: boolean;
}

export interface PackLine {
  id: number;
  product_name: string;
  location_code: string;
  zone: ZoneBadge;
  quantity_required: number;
  quantity_verified: number;
  unit_codes: string[];
  verified_unit_codes: string[];
  status: PackLineStatus;
}

export interface BoxSpec {
  box_size: string;
  total_weight: string;
  cold_pack: string;
  seal_type: string;
}

export interface PackLabel {
  label_code: string;
  deliver_to_name: string;
  deliver_to_address: string;
  items_summary: string;
  special_notes: string | null;
  packed_by: string;
  packed_at: string | null;
}

export interface PackJobSummary {
  id: string;
  order_id: string;
  store_name: string;
  item_count: number;
  box_hint: string;
  station_label: string;
  status: PackJobStatus;
  assigned_packer_id?: number | null;
}

export interface PackJobDetail extends PackJobSummary {
  pack_lines: PackLine[];
  box_spec: BoxSpec;
  label: PackLabel;
  label_printed: boolean;
  label_linked: boolean;
  units_verified: number;
  units_required: number;
}

export interface PackerDashboardStats {
  packedToday: number;
  inQueue: number;
  accuracy: number;
}

export interface PackScanResult {
  fulfillment_request_id: string;
  unit_code: string;
  units_packed: number;
  units_required: number;
  pack_complete: boolean;
  job: PackJobDetail;
}

export interface SubmitPackScanParams {
  jobId: string;
  packerId: number;
  warehouseId: number;
  payload: string;
}

export interface LinkPackLabelParams {
  jobId: string;
  packerId: number;
  payload: string;
}

export interface PackHandoffResult {
  message: string;
  status: PackJobStatus;
  job: PackJobDetail;
}
