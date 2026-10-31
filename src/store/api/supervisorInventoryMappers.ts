import type {
  SupervisorDamageClaimTask,
  SupervisorInventoryTasksResponse,
  SupervisorInventoryTasksSummary,
  SupervisorRecountTask,
  SupervisorStockBalanceSnapshot,
} from "@/interfaces/supervisor";

type RawStockBalance = {
  id: number;
  location_id: number | null;
  location_code: string;
  location_detail: string;
  zone: SupervisorStockBalanceSnapshot["zone"];
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_damaged: number;
};

type RawRecountTask = {
  id: number;
  task_type: "recount";
  exception_id: number;
  pick_line_id: number;
  fulfillment_request_id: string;
  order_id: string;
  exception_type: SupervisorRecountTask["exceptionType"];
  product_name: string;
  seller_sku?: string;
  location_id: number | null;
  location_code: string;
  location_detail: string;
  zone: SupervisorRecountTask["zone"];
  balance_id: number | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  quantity_found: number;
  quantity_required: number;
  resolution_notes?: string;
  resolved_at: string | null;
  resolved_by_name?: string;
  balance?: RawStockBalance | null;
};

type RawDamageClaim = {
  id: number;
  task_type: "damage_claim";
  claim_id: number;
  unit_code: string;
  product_name: string;
  seller_sku?: string;
  location_id: number | null;
  location_code: string;
  location_detail: string;
  zone: SupervisorDamageClaimTask["zone"];
  quantity_damaged: number;
  damage_type: SupervisorDamageClaimTask["damageType"];
  liability: SupervisorDamageClaimTask["liability"];
  estimated_value: string | null;
  photo_evidence_urls?: string[];
  notes?: string;
  created_at: string;
  resolved: boolean;
  resolved_at: string | null;
};

function mapStockBalance(
  record: RawStockBalance | null | undefined,
): SupervisorStockBalanceSnapshot | null {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    locationId: record.location_id,
    locationCode: record.location_code,
    locationDetail: record.location_detail,
    zone: record.zone,
    quantityOnHand: record.quantity_on_hand,
    quantityReserved: record.quantity_reserved,
    quantityAvailable: record.quantity_available,
    quantityDamaged: record.quantity_damaged,
  };
}

export function mapRecountTask(record: RawRecountTask): SupervisorRecountTask {
  return {
    id: record.id,
    taskType: "recount",
    exceptionId: record.exception_id,
    pickLineId: record.pick_line_id,
    fulfillmentRequestId: record.fulfillment_request_id,
    orderId: record.order_id,
    exceptionType: record.exception_type,
    productName: record.product_name,
    sku: record.seller_sku ?? "",
    locationId: record.location_id,
    locationCode: record.location_code,
    locationDetail: record.location_detail,
    zone: record.zone,
    balanceId: record.balance_id,
    quantityOnHand: record.quantity_on_hand,
    quantityReserved: record.quantity_reserved,
    quantityAvailable: record.quantity_available,
    quantityFound: record.quantity_found,
    quantityRequired: record.quantity_required,
    resolutionNotes: record.resolution_notes ?? "",
    resolvedAt: record.resolved_at,
    resolvedByName: record.resolved_by_name ?? "",
    balance: mapStockBalance(record.balance),
  };
}

export function mapDamageClaimTask(
  record: RawDamageClaim,
): SupervisorDamageClaimTask {
  return {
    id: record.id,
    taskType: "damage_claim",
    claimId: record.claim_id,
    unitCode: record.unit_code,
    productName: record.product_name,
    sku: record.seller_sku ?? "",
    locationId: record.location_id,
    locationCode: record.location_code,
    locationDetail: record.location_detail,
    zone: record.zone,
    quantityDamaged: record.quantity_damaged,
    damageType: record.damage_type,
    liability: record.liability,
    estimatedValue: record.estimated_value,
    photoEvidenceUrls: record.photo_evidence_urls ?? [],
    notes: record.notes ?? "",
    createdAt: record.created_at,
    resolved: record.resolved,
    resolvedAt: record.resolved_at,
  };
}

export function mapInventoryTasksSummary(
  record: {
    pending_recounts: number;
    pending_damage_claims: number;
    total: number;
  },
): SupervisorInventoryTasksSummary {
  return {
    pendingRecounts: record.pending_recounts,
    pendingDamageClaims: record.pending_damage_claims,
    total: record.total,
  };
}

export function mapInventoryTasksResponse(
  record: {
    recount_tasks: RawRecountTask[];
    damage_claims: RawDamageClaim[];
    summary: {
      pending_recounts: number;
      pending_damage_claims: number;
      total: number;
    };
  },
): SupervisorInventoryTasksResponse {
  return {
    recountTasks: record.recount_tasks.map(mapRecountTask),
    damageClaims: record.damage_claims.map(mapDamageClaimTask),
    summary: mapInventoryTasksSummary(record.summary),
  };
}
