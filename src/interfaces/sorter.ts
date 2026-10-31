import type { ZoneBadge } from "@/interfaces/picker";

export type InboundShipmentStatus =
  | "scheduled"
  | "collection_dispatched"
  | "in_transit"
  | "arrived"
  | "receiving"
  | "received"
  | "partial_received";

export type DeliveryMethod = "seller_delivery" | "vhotis_collection";

export type PackagingMode = "loose" | "boxed";

export type ReceiptLineStatus = "pending" | "accepted" | "partial" | "rejected";

export type ReceiptLineStage =
  | "awaiting_tag"
  | "awaiting_verify"
  | "awaiting_putaway"
  | "stored";

export type SortUiStep =
  | "overview"
  | "tag"
  | "verify"
  | "container"
  | "putaway"
  | "confirmed";

export interface ManifestLine {
  id: number;
  declared_name: string;
  declared_sku: string;
  declared_size: string;
  declared_quantity: number;
  declared_unit: string;
  is_temperature_sensitive: boolean;
  requires_frozen: boolean;
  zone: ZoneBadge;
  product_id: string | null;
  product_name: string | null;
  receipt_line_id: number | null;
}

export interface StockUnitRecord {
  unit_code: string;
  status: "received" | "stored";
  verified: boolean;
  location_code: string | null;
  container_code: string | null;
}

export interface StorageContainerRecord {
  container_code: string;
  status: "sealed" | "stored";
  unit_codes: string[];
  location_code: string | null;
  verified: boolean;
}

export interface ReceiptLineSummary {
  id: number;
  shipment_id: string;
  product_name: string;
  product_id: string;
  seller_sku: string;
  received_quantity: number;
  damaged_quantity: number;
  accepted_quantity: number;
  packaging_mode: PackagingMode;
  carton_count: number | null;
  units_per_carton: number | null;
  status: ReceiptLineStatus;
  stage: ReceiptLineStage;
  units_awaiting_putaway: number;
  units_stored: number;
  container_count: number;
  suggested_location: string;
  zone: ZoneBadge;
}

export interface ReceiptLineDetail extends ReceiptLineSummary {
  manifest_line_id: number | null;
  stock_units: StockUnitRecord[];
  storage_containers: StorageContainerRecord[];
  tagged: boolean;
}

export interface InboundShipmentSummary {
  id: string;
  status: InboundShipmentStatus;
  seller_store_name: string;
  seller_name: string;
  delivery_method: DeliveryMethod;
  warehouse_name: string;
  manifest_line_count: number;
  total_declared_weight_kg: number | null;
  expected_arrival_at: string | null;
  received_at?: string | null;
  reference_notes: string;
}

export interface InboundShipmentDetail extends InboundShipmentSummary {
  manifest_lines: ManifestLine[];
  receipt_lines: ReceiptLineSummary[];
}

export interface SorterDashboardStats {
  taggedToday: number;
  awaitingPutaway: number;
  awaitingVerify: number;
  accuracy: number;
}

export interface AddReceiptLineParams {
  shipmentId: string;
  manifestLineId: number;
  productId: string;
  receivedQuantity: number;
  damagedQuantity: number;
  packagingMode: PackagingMode;
  cartonCount?: number;
  unitsPerCarton?: number;
}

export interface SubmitPutawayParams {
  lineId: number;
  employeeId: number;
  warehouseId: number;
  shipmentId: string;
  locationPayload: string;
  unitCode?: string;
  containerCode?: string;
}

export interface PutawayResult {
  location_code: string;
  units_put_away: number;
  containers_put_away: number;
  receipt_line_finalized: boolean;
  line: ReceiptLineDetail;
}

export interface TagReceiptLineResult {
  line: ReceiptLineDetail;
  unit_codes: string[];
  container_codes: string[];
}
