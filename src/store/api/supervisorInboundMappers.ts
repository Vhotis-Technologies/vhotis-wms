import type {
  SupervisorInboundApprovalDetail,
  SupervisorInboundApprovalSummary,
  SupervisorInboundApprovalsResponse,
  SupervisorInboundVarianceLine,
} from "@/interfaces/supervisor";

type RawVarianceLine = {
  id: number;
  shipment_id: string;
  manifest_line_id: number | null;
  product_name: string;
  seller_sku?: string;
  declared_quantity: number | null;
  received_quantity: number;
  damaged_quantity: number;
  accepted_quantity: number;
  status: SupervisorInboundVarianceLine["status"];
  notes?: string;
  has_variance: boolean;
  needs_approval: boolean;
};

type RawApprovalSummary = {
  id: string;
  status: string;
  seller_store_name: string;
  seller_name: string;
  delivery_method: string;
  warehouse_code: string;
  manifest_line_count: number;
  reference_notes?: string;
  expected_arrival_at: string | null;
  received_at: string | null;
  variance_line_count: number;
  pending_variance_count: number;
  needs_sign_off: boolean;
  variance_lines?: RawVarianceLine[];
  receipt_lines?: RawVarianceLine[];
};

function mapVarianceLine(record: RawVarianceLine): SupervisorInboundVarianceLine {
  return {
    id: record.id,
    shipmentId: record.shipment_id,
    manifestLineId: record.manifest_line_id,
    productName: record.product_name,
    sku: record.seller_sku ?? "",
    declaredQuantity: record.declared_quantity,
    receivedQuantity: record.received_quantity,
    damagedQuantity: record.damaged_quantity,
    acceptedQuantity: record.accepted_quantity,
    status: record.status,
    notes: record.notes ?? "",
    hasVariance: record.has_variance,
    needsApproval: record.needs_approval,
  };
}

export function mapInboundApprovalSummary(
  record: RawApprovalSummary,
): SupervisorInboundApprovalSummary {
  return {
    id: record.id,
    status: record.status,
    sellerStoreName: record.seller_store_name,
    sellerName: record.seller_name,
    deliveryMethod: record.delivery_method,
    warehouseCode: record.warehouse_code,
    manifestLineCount: record.manifest_line_count,
    referenceNotes: record.reference_notes ?? "",
    expectedArrivalAt: record.expected_arrival_at,
    receivedAt: record.received_at,
    varianceLineCount: record.variance_line_count,
    pendingVarianceCount: record.pending_variance_count,
    needsSignOff: record.needs_sign_off,
  };
}

export function mapInboundApprovalDetail(
  record: RawApprovalSummary,
): SupervisorInboundApprovalDetail {
  return {
    ...mapInboundApprovalSummary(record),
    varianceLines: (record.variance_lines ?? []).map(mapVarianceLine),
    receiptLines: (record.receipt_lines ?? []).map(mapVarianceLine),
  };
}

export function mapInboundApprovalsResponse(
  record: { approvals: RawApprovalSummary[]; total: number },
): SupervisorInboundApprovalsResponse {
  return {
    approvals: record.approvals.map(mapInboundApprovalSummary),
    total: record.total,
  };
}

export function mapInboundVarianceLine(
  record: RawVarianceLine,
): SupervisorInboundVarianceLine {
  return mapVarianceLine(record);
}
