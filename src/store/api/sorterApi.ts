import type {
  AddReceiptLineParams,
  InboundShipmentDetail,
  InboundShipmentSummary,
  PutawayResult,
  ReceiptLineDetail,
  ReceiptLineSummary,
  SorterDashboardStats,
  SubmitPutawayParams,
  TagReceiptLineResult,
} from "@/interfaces/sorter";
import { wmsFetch } from "@/store/api/client";
import {
  mapInboundShipmentDetail,
  mapInboundShipmentSummary,
  mapPutawayResult,
  mapReceiptLineDetail,
  mapReceiptLineSummary,
  mapSorterStats,
  mapTagReceiptLineResult,
} from "@/store/api/sorterMappers";

export function listInboundShipments(
  warehouseId: number,
  statuses?: string[],
): Promise<InboundShipmentSummary[]> {
  const statusParam = statuses?.length ? `&status=${statuses.join(",")}` : "";
  return wmsFetch<unknown[]>(
    `/api/v3/receiving/list_inbound_shipments/?warehouse_id=${warehouseId}${statusParam}`,
  ).then((rows) => rows.map((row) => mapInboundShipmentSummary(row as never)));
}

export function getShipment(shipmentId: string): Promise<InboundShipmentDetail> {
  return wmsFetch<unknown>(
    `/api/v3/receiving/get_receiving/?shipment_id=${shipmentId}`,
  ).then((row) => mapInboundShipmentDetail(row as never));
}

export function listAwaitingTag(_warehouseId: number): Promise<ReceiptLineSummary[]> {
  return wmsFetch<unknown[]>(
    `/api/v3/receiving/list_awaiting_tag/?warehouse_id=${_warehouseId}`,
  ).then((rows) => rows.map((row) => mapReceiptLineSummary(row as never)));
}

export function listAwaitingPutaway(_warehouseId: number): Promise<ReceiptLineSummary[]> {
  return wmsFetch<unknown[]>(
    `/api/v3/receiving/list_awaiting_putaway/?warehouse_id=${_warehouseId}`,
  ).then((rows) => rows.map((row) => mapReceiptLineSummary(row as never)));
}

export function listAwaitingVerify(_warehouseId: number): Promise<ReceiptLineSummary[]> {
  return wmsFetch<unknown[]>(
    `/api/v3/receiving/list_awaiting_verify/?warehouse_id=${_warehouseId}`,
  ).then((rows) => rows.map((row) => mapReceiptLineSummary(row as never)));
}

export function getReceiptLine(
  lineId: number,
  _shipmentId?: string,
): Promise<ReceiptLineDetail> {
  const shipmentParam = _shipmentId ? `&shipment_id=${_shipmentId}` : "";
  return wmsFetch<unknown>(
    `/api/v3/receiving/get_receipt_line/?line_id=${lineId}${shipmentParam}`,
  ).then((row) => mapReceiptLineDetail(row as never, _shipmentId));
}

export function getSorterStats(warehouseId: number): Promise<SorterDashboardStats> {
  return wmsFetch<unknown>(
    `/api/v3/receiving/sorter_stats/?warehouse_id=${warehouseId}`,
  ).then((row) => mapSorterStats(row as never));
}

export async function arriveShipment(shipmentId: string): Promise<InboundShipmentDetail> {
  await wmsFetch<unknown>("/api/v3/receiving/arrive/", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
  return getShipment(shipmentId);
}

export async function addReceiptLine(params: AddReceiptLineParams): Promise<ReceiptLineDetail> {
  const raw = await wmsFetch<unknown>("/api/v3/receiving/add_receipt_line/", {
    method: "POST",
    body: JSON.stringify({
      shipment_id: params.shipmentId,
      manifest_line_id: params.manifestLineId,
      product_id: params.productId,
      received_quantity: params.receivedQuantity,
      damaged_quantity: params.damagedQuantity,
      packaging_mode: params.packagingMode,
      carton_count: params.cartonCount,
      units_per_carton: params.unitsPerCarton,
    }),
  });
  return mapReceiptLineDetail(raw as never, params.shipmentId);
}

export async function tagReceiptLine(
  lineId: number,
  shipmentId: string,
  _employeeId: number,
): Promise<TagReceiptLineResult> {
  const raw = await wmsFetch<unknown>("/api/v3/receiving/tag_receipt_line/", {
    method: "POST",
    body: JSON.stringify({
      line_id: lineId,
      shipment_id: shipmentId,
      employee_id: _employeeId,
    }),
  });
  const mapped = mapTagReceiptLineResult(raw as never, shipmentId);
  const refreshed = await getReceiptLine(lineId, shipmentId);
  return {
    ...mapped,
    line:
      refreshed.stock_units.length >= mapped.line.stock_units.length
        ? refreshed
        : mapped.line,
    unit_codes:
      refreshed.stock_units.length >= mapped.unit_codes.length
        ? refreshed.stock_units.map((unit) => unit.unit_code)
        : mapped.unit_codes,
    container_codes:
      refreshed.storage_containers.length >= mapped.container_codes.length
        ? refreshed.storage_containers.map((container) => container.container_code)
        : mapped.container_codes,
  };
}

export function submitUnitVerify(
  lineId: number,
  payload: string,
  shipmentId?: string,
): Promise<ReceiptLineDetail> {
  return wmsFetch<unknown>("/api/v3/receiving/verify_unit/", {
    method: "POST",
    body: JSON.stringify({
      line_id: lineId,
      payload,
      shipment_id: shipmentId,
    }),
  }).then((row) => mapReceiptLineDetail(row as never, shipmentId));
}

export function submitContainerVerify(
  lineId: number,
  payload: string,
  shipmentId?: string,
): Promise<ReceiptLineDetail> {
  return wmsFetch<unknown>("/api/v3/receiving/verify_container/", {
    method: "POST",
    body: JSON.stringify({
      line_id: lineId,
      payload,
      shipment_id: shipmentId,
    }),
  }).then((row) => mapReceiptLineDetail(row as never, shipmentId));
}

export async function submitPutaway(params: SubmitPutawayParams): Promise<PutawayResult> {
  const raw = await wmsFetch<unknown>("/api/v3/receiving/putaway/", {
    method: "POST",
    body: JSON.stringify({
      line_id: params.lineId,
      employee_id: params.employeeId,
      warehouse_id: params.warehouseId,
      shipment_id: params.shipmentId,
      location_payload: params.locationPayload,
      unit_code: params.unitCode,
      container_code: params.containerCode,
    }),
  });
  const mapped = mapPutawayResult(raw as never, params.shipmentId);
  const refreshed = await getReceiptLine(params.lineId, params.shipmentId);
  return {
    ...mapped,
    line: refreshed,
  };
}

export async function completeReceiving(shipmentId: string): Promise<InboundShipmentDetail> {
  await wmsFetch<unknown>("/api/v3/receiving/complete_receiving/", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
  return getShipment(shipmentId);
}
