import type { ZoneBadge } from "@/interfaces/picker";
import type {
  DeliveryMethod,
  InboundShipmentDetail,
  InboundShipmentStatus,
  InboundShipmentSummary,
  ManifestLine,
  PackagingMode,
  PutawayResult,
  ReceiptLineDetail,
  ReceiptLineStage,
  ReceiptLineStatus,
  ReceiptLineSummary,
  StockUnitRecord,
  StorageContainerRecord,
  TagReceiptLineResult,
} from "@/interfaces/sorter";

type RawManifestLine = {
  id: number;
  declared_name: string;
  declared_sku?: string;
  declared_size?: string;
  declared_quantity: number;
  declared_unit: string;
  is_temperature_sensitive?: boolean;
  requires_frozen?: boolean;
  catalog_product_id?: string | null;
  catalog_product_name?: string | null;
  receipt_line_id?: number | null;
};

type RawStockUnit = {
  unit_code: string;
  status: string;
  verified?: boolean;
  location_code?: string | null;
  container_code?: string | null;
};

type RawStorageContainer = {
  container_code: string;
  status: string;
  verified?: boolean;
  location_code?: string | null;
};

type RawReceiptLine = {
  id: number;
  shipment_id?: string;
  manifest_line?: number | null;
  manifest_line_id?: number | null;
  product?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  seller_sku?: string;
  received_quantity: number;
  damaged_quantity: number;
  accepted_quantity: number;
  packaging_mode: string;
  carton_count?: number | null;
  units_per_carton?: number | null;
  status: string;
  location_code?: string | null;
  units_awaiting_putaway?: number;
  units_stored?: number;
  container_count?: number;
  stock_units?: RawStockUnit[];
  storage_containers?: RawStorageContainer[];
};

type RawShipment = {
  id: string;
  status: string;
  delivery_method: string;
  warehouse_name?: string;
  seller_store_name?: string;
  seller_name?: string;
  manifest_line_count?: number;
  total_declared_weight_kg?: number | null;
  expected_arrival_at?: string | null;
  received_at?: string | null;
  reference_notes?: string;
  manifest_lines?: RawManifestLine[];
  receipt_lines?: RawReceiptLine[];
};

type RawTagResponse = {
  receipt_line: RawReceiptLine;
  units?: RawStockUnit[];
  containers?: RawStorageContainer[];
};

type RawPutawayResponse = {
  location_id?: number;
  location_code?: string | null;
  units_put_away: number;
  containers_put_away: number;
  receipt_line_finalized: boolean;
  receipt_line?: RawReceiptLine | null;
};

function zoneFromTemperatureFlags(
  requiresFrozen?: boolean,
  isTemperatureSensitive?: boolean,
): ZoneBadge {
  if (requiresFrozen) return "FRZ";
  if (isTemperatureSensitive) return "CHL";
  return "AMB";
}

function mapDeliveryMethod(value: string): DeliveryMethod {
  return value === "vhotis_collection" ? "vhotis_collection" : "seller_delivery";
}

function mapShipmentStatus(value: string): InboundShipmentStatus {
  const allowed: InboundShipmentStatus[] = [
    "scheduled",
    "collection_dispatched",
    "in_transit",
    "arrived",
    "receiving",
    "received",
    "partial_received",
  ];
  if (allowed.includes(value as InboundShipmentStatus)) {
    return value as InboundShipmentStatus;
  }
  return "scheduled";
}

function mapReceiptLineStatus(value: string): ReceiptLineStatus {
  if (value === "accepted" || value === "partial" || value === "rejected") {
    return value;
  }
  return "pending";
}

function mapPackagingMode(value: string): PackagingMode {
  return value === "boxed" ? "boxed" : "loose";
}

function mapStockUnits(units: RawStockUnit[] | undefined): StockUnitRecord[] {
  return (units ?? []).map((unit) => ({
    unit_code: unit.unit_code,
    status: unit.status === "stored" ? "stored" : "received",
    verified: Boolean(unit.verified),
    location_code: unit.location_code ?? null,
    container_code: unit.container_code ?? null,
  }));
}

function mapStorageContainers(
  containers: RawStorageContainer[] | undefined,
  stockUnits: StockUnitRecord[],
): StorageContainerRecord[] {
  return (containers ?? []).map((container) => {
    const unitCodes = stockUnits
      .filter((unit) => unit.container_code === container.container_code)
      .map((unit) => unit.unit_code);
    const verified =
      container.verified ??
      (unitCodes.length === 0 ||
        unitCodes.every((code) =>
          stockUnits.some((unit) => unit.unit_code === code && unit.verified),
        ));
    return {
      container_code: container.container_code,
      status: container.status === "stored" ? "stored" : "sealed",
      unit_codes: unitCodes,
      location_code: container.location_code ?? null,
      verified,
    };
  });
}

function computeStage(
  line: Pick<
    ReceiptLineDetail,
    "accepted_quantity" | "units_stored" | "tagged" | "stock_units"
  >,
): ReceiptLineStage {
  if (line.units_stored >= line.accepted_quantity && line.accepted_quantity > 0) {
    return "stored";
  }
  if (!line.tagged || line.stock_units.length === 0) {
    return "awaiting_tag";
  }
  const unverified = line.stock_units.some((unit) => !unit.verified);
  if (unverified) {
    return "awaiting_verify";
  }
  return "awaiting_putaway";
}

function mapManifestLine(raw: RawManifestLine): ManifestLine {
  return {
    id: raw.id,
    declared_name: raw.declared_name,
    declared_sku: raw.declared_sku ?? "",
    declared_size: raw.declared_size ?? "",
    declared_quantity: raw.declared_quantity,
    declared_unit: raw.declared_unit,
    is_temperature_sensitive: Boolean(raw.is_temperature_sensitive),
    requires_frozen: Boolean(raw.requires_frozen),
    zone: zoneFromTemperatureFlags(raw.requires_frozen, raw.is_temperature_sensitive),
    product_id: raw.catalog_product_id ?? null,
    product_name: raw.catalog_product_name ?? null,
    receipt_line_id: raw.receipt_line_id ?? null,
  };
}

export function mapReceiptLineDetail(
  raw: RawReceiptLine,
  shipmentId?: string,
  manifestLine?: RawManifestLine | null,
): ReceiptLineDetail {
  const stockUnits = mapStockUnits(raw.stock_units);
  const storageContainers = mapStorageContainers(raw.storage_containers, stockUnits);
  const tagged = stockUnits.length > 0;
  const unitsStored =
    raw.units_stored ?? stockUnits.filter((unit) => unit.status === "stored").length;
  const unitsAwaitingPutaway =
    raw.units_awaiting_putaway ??
    stockUnits.filter((unit) => unit.status === "received" && unit.verified).length;

  const detail: ReceiptLineDetail = {
    id: raw.id,
    shipment_id: raw.shipment_id ?? shipmentId ?? "",
    manifest_line_id: raw.manifest_line_id ?? raw.manifest_line ?? null,
    product_id: raw.product_id ?? raw.product ?? "",
    product_name: raw.product_name ?? "",
    seller_sku: raw.seller_sku ?? "",
    received_quantity: raw.received_quantity,
    damaged_quantity: raw.damaged_quantity,
    accepted_quantity: raw.accepted_quantity,
    packaging_mode: mapPackagingMode(raw.packaging_mode),
    carton_count: raw.carton_count ?? null,
    units_per_carton: raw.units_per_carton ?? null,
    status: mapReceiptLineStatus(raw.status),
    stage: "awaiting_tag",
    units_awaiting_putaway: unitsAwaitingPutaway,
    units_stored: unitsStored,
    container_count: raw.container_count ?? storageContainers.length,
    suggested_location: raw.location_code ?? "",
    zone: zoneFromTemperatureFlags(
      manifestLine?.requires_frozen,
      manifestLine?.is_temperature_sensitive,
    ),
    stock_units: stockUnits,
    storage_containers: storageContainers,
    tagged,
  };

  detail.stage = computeStage(detail);
  return detail;
}

export function mapReceiptLineSummary(
  raw: RawReceiptLine,
  shipmentId?: string,
  manifestLine?: RawManifestLine | null,
): ReceiptLineSummary {
  const detail = mapReceiptLineDetail(raw, shipmentId, manifestLine);
  return {
    id: detail.id,
    shipment_id: detail.shipment_id,
    product_name: detail.product_name,
    product_id: detail.product_id,
    seller_sku: detail.seller_sku,
    received_quantity: detail.received_quantity,
    damaged_quantity: detail.damaged_quantity,
    accepted_quantity: detail.accepted_quantity,
    packaging_mode: detail.packaging_mode,
    carton_count: detail.carton_count,
    units_per_carton: detail.units_per_carton,
    status: detail.status,
    stage: detail.stage,
    units_awaiting_putaway: detail.units_awaiting_putaway,
    units_stored: detail.units_stored,
    container_count: detail.container_count,
    suggested_location: detail.suggested_location,
    zone: detail.zone,
  };
}

function manifestById(
  manifestLines: RawManifestLine[] | undefined,
): Map<number, RawManifestLine> {
  return new Map((manifestLines ?? []).map((line) => [line.id, line]));
}

export function mapInboundShipmentDetail(raw: RawShipment): InboundShipmentDetail {
  const manifestMap = manifestById(raw.manifest_lines);
  const receiptByManifestId = new Map<number, number>();

  for (const line of raw.receipt_lines ?? []) {
    const manifestLineId = line.manifest_line_id ?? line.manifest_line;
    if (manifestLineId != null) {
      receiptByManifestId.set(manifestLineId, line.id);
    }
  }

  const receiptLines = (raw.receipt_lines ?? []).map((line) => {
    const manifestLine =
      manifestMap.get(line.manifest_line_id ?? line.manifest_line ?? -1) ?? null;
    return mapReceiptLineSummary(line, raw.id, manifestLine);
  });

  const manifestLines = (raw.manifest_lines ?? []).map((line) => {
    const mapped = mapManifestLine(line);
    return {
      ...mapped,
      receipt_line_id:
        mapped.receipt_line_id ?? receiptByManifestId.get(mapped.id) ?? null,
    };
  });

  return {
    id: raw.id,
    status: mapShipmentStatus(raw.status),
    seller_store_name: raw.seller_store_name ?? raw.seller_name ?? "Seller",
    seller_name: raw.seller_name ?? raw.seller_store_name ?? "Seller",
    delivery_method: mapDeliveryMethod(raw.delivery_method),
    warehouse_name: raw.warehouse_name ?? "",
    manifest_line_count:
      raw.manifest_line_count ?? manifestLines.length,
    total_declared_weight_kg: raw.total_declared_weight_kg ?? null,
    expected_arrival_at: raw.expected_arrival_at ?? null,
    received_at: raw.received_at ?? null,
    reference_notes: raw.reference_notes ?? "",
    manifest_lines: manifestLines,
    receipt_lines: receiptLines,
  };
}

export function mapInboundShipmentSummary(raw: RawShipment): InboundShipmentSummary {
  const detail = mapInboundShipmentDetail(raw);
  return {
    id: detail.id,
    status: detail.status,
    seller_store_name: detail.seller_store_name,
    seller_name: detail.seller_name,
    delivery_method: detail.delivery_method,
    warehouse_name: detail.warehouse_name,
    manifest_line_count: detail.manifest_line_count,
    total_declared_weight_kg: detail.total_declared_weight_kg,
    expected_arrival_at: detail.expected_arrival_at,
    received_at: detail.received_at ?? null,
    reference_notes: detail.reference_notes,
  };
}

export function mapTagReceiptLineResult(
  raw: RawTagResponse,
  shipmentId?: string,
): TagReceiptLineResult {
  let line = mapReceiptLineDetail(raw.receipt_line, shipmentId);

  if (line.stock_units.length === 0 && raw.units?.length) {
    const stockUnits = mapStockUnits(raw.units);
    const storageContainers = mapStorageContainers(raw.containers, stockUnits);
    line = {
      ...line,
      stock_units: stockUnits,
      storage_containers: storageContainers,
      tagged: true,
      container_count: storageContainers.length,
      units_awaiting_putaway: stockUnits.filter((unit) => unit.status === "received").length,
    };
    line.stage = computeStage(line);
  }

  const unitCodes =
    raw.units?.map((unit) => unit.unit_code) ??
    line.stock_units.map((unit) => unit.unit_code);
  const containerCodes =
    raw.containers?.map((container) => container.container_code) ??
    line.storage_containers.map((container) => container.container_code);

  return {
    line,
    unit_codes: unitCodes,
    container_codes: containerCodes,
  };
}

export function mapPutawayResult(
  raw: RawPutawayResponse,
  shipmentId?: string,
): PutawayResult {
  if (!raw.receipt_line) {
    throw new Error("Putaway response missing receipt line.");
  }
  return {
    location_code: raw.location_code ?? String(raw.location_id ?? ""),
    units_put_away: raw.units_put_away,
    containers_put_away: raw.containers_put_away,
    receipt_line_finalized: raw.receipt_line_finalized,
    line: mapReceiptLineDetail(raw.receipt_line, shipmentId),
  };
}

type RawSorterStats = {
  tagged_today: number;
  awaiting_putaway: number;
  awaiting_verify?: number;
  accuracy: number;
};

export function mapSorterStats(raw: RawSorterStats) {
  return {
    taggedToday: raw.tagged_today,
    awaitingPutaway: raw.awaiting_putaway,
    awaitingVerify: raw.awaiting_verify ?? 0,
    accuracy: raw.accuracy,
  };
}
