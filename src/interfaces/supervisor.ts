import type { PackLine } from "@/interfaces/packer";
import type { PickLine } from "@/interfaces/picker";

/** Server-side PickException.exception_type */
export type PickExceptionType =
  | "short_pick"
  | "location_empty"
  | "wrong_product"
  | "damaged_stock"
  | "label_unreadable"
  | "product_mismatch"
  | "other";

/** Server-side PickException.resolution */
export type PickExceptionResolution =
  | "pending"
  | "partial_fulfil"
  | "substitute_approved"
  | "cancel_line"
  | "relocated"
  | "recount_ordered"
  | "dismissed";

/** Resolution actions a supervisor may apply (excludes pending). */
export type SupervisorExceptionResolution = Exclude<
  PickExceptionResolution,
  "pending"
>;

export type SupervisorPermissionKey =
  | "approve_exceptions"
  | "override_stock_counts"
  | "approve_inbound_shipments"
  | "manage_assignments"
  | "approve_damage_claims";

export type ManagementRole = "supervisor" | "manager";

export interface SupervisorPermissions {
  can_approve_exceptions: boolean;
  can_override_stock_counts: boolean;
  can_approve_inbound_shipments: boolean;
  can_manage_assignments: boolean;
  can_approve_damage_claims: boolean;
}

export interface SupervisorProfile {
  management_role: ManagementRole;
  exceptions_resolved_today: number;
  avg_exception_resolution_minutes: number;
  can_approve_exceptions: boolean;
  can_override_stock_counts: boolean;
  can_approve_inbound_shipments: boolean;
  can_manage_assignments: boolean;
  can_approve_damage_claims: boolean;
  device_token_registered?: boolean;
  notify_exceptions_enabled?: boolean;
}

/** Raw API shape for a pending pick exception. */
export interface PickExceptionRecord {
  id: number;
  pick_line_id: number;
  fulfillment_request_id: string;
  raised_by_employee_id: string;
  raised_by_name?: string;
  resolved_by_employee_id: string | null;
  resolved_by_name?: string;
  exception_type: PickExceptionType;
  quantity_found: number;
  quantity_required?: number;
  resolution: PickExceptionResolution;
  resolution_notes: string;
  photo_urls: string[];
  raised_at: string;
  resolved_at: string | null;
  product_name?: string;
  seller_sku?: string;
  location_code?: string;
  location_detail?: string;
  zone?: "AMB" | "CHL" | "FRZ";
  age_minutes?: number;
  order_id?: string;
  pick_line_status?: "pending" | "picked" | "short" | "cancelled";
  quantity_picked?: number;
  fulfillment_status?: string;
  recount_pending?: boolean;
  linked_damage_claim_id?: number | null;
  damage_claim_pending?: boolean;
}

/** UI-ready exception summary (mapped in supervisorMappers). */
export interface PickExceptionSummary {
  id: number;
  pickLineId: number;
  fulfillmentRequestId: string;
  orderId: string;
  exceptionType: PickExceptionType;
  exceptionLabel: string;
  productName: string;
  sku: string;
  locationCode: string;
  locationDetail: string;
  zone: "AMB" | "CHL" | "FRZ";
  raisedByEmployeeId: string;
  raisedByName: string;
  raisedAt: string;
  ageMinutes: number;
  isStale: boolean;
  photoUrls: string[];
  quantityFound: number;
  quantityRequired: number;
  quantityPicked: number;
  pickLineStatus: "pending" | "picked" | "short" | "cancelled";
  fulfillmentStatus: string;
  pickerNotes: string;
  isPending: boolean;
  hasPhotos: boolean;
  resolution: PickExceptionResolution;
  resolvedAt: string | null;
  resolvedByEmployeeId: string | null;
  resolvedByName: string;
  resolutionNotes: string;
  recountPending: boolean;
  linkedDamageClaimId: number | null;
  damageClaimPending: boolean;
}

export interface ResolvePickExceptionResult {
  exception: PickExceptionSummary;
  pickLineStatus: PickExceptionSummary["pickLineStatus"];
  fulfillmentRequestId: string;
  message: string;
}

export interface SupervisorRelocateLocation {
  id: number;
  code: string;
  locationType: string;
  zone: "AMB" | "CHL" | "FRZ";
  locationDetail: string;
  availableQuantity: number;
}

export interface ResolvedLocationScan {
  locationId: number;
  code: string;
  locationDetail: string;
  zone: "AMB" | "CHL" | "FRZ";
}

export interface SupervisorStaffOnFloor {
  inbound: number;
  pick: number;
  pack: number;
  total: number;
}

export interface SupervisorDashboardStats {
  warehouseId: number;
  warehouseCode: string;
  pendingExceptions: number;
  staleExceptions: number;
  oldestExceptionMinutes: number;
  blockedJobs: number;
  pickQueue: number;
  packQueue: number;
  inboundReceiving: number;
  dispatchedToday: number;
  pendingInventoryTasks: number;
  pendingRecounts: number;
  pendingDamageClaims: number;
  staffOnFloor: SupervisorStaffOnFloor;
  generatedAt: string;
}

export type SupervisorPulseTileId =
  | "exceptions"
  | "blocked"
  | "pick"
  | "pack"
  | "inbound"
  | "dispatch"
  | "staff";

export interface SupervisorPulseTile {
  id: SupervisorPulseTileId;
  value: number;
  label: string;
  tone?: "success" | "warning" | "primary";
  route?: string;
  disabled?: boolean;
}

export type SupervisorJobSegment =
  | "blocked"
  | "picking"
  | "ready_to_pack"
  | "packing"
  | "dispatch";

export interface SupervisorJobSummary {
  id: string;
  orderId: string;
  storeName: string;
  status: string;
  segment: SupervisorJobSegment;
  packStatus: string;
  itemCount: number;
  zones: ("AMB" | "CHL" | "FRZ")[];
  hasPendingExceptions: boolean;
  pendingExceptionCount: number;
  assignedPickerId: number | null;
  assignedPickerName: string;
  assignedPackerId: number | null;
  assignedPackerName: string;
  unitsVerified: number;
  unitsRequired: number;
  reservedAt: string | null;
  pickingStartedAt: string | null;
  packedAt: string | null;
  updatedAt: string;
}

export interface SupervisorJobDetail extends SupervisorJobSummary {
  warehouseCode: string;
  showPack: boolean;
  pickLines: PickLine[];
  packLines: PackLine[];
  boxHint: string;
  stationLabel: string;
  labelPrinted: boolean;
  labelLinked: boolean;
  exceptions: PickExceptionSummary[];
  pendingExceptions: PickExceptionSummary[];
  resolvedExceptions: PickExceptionSummary[];
  createdAt: string;
  dispatchedAt: string | null;
}

export type FloorWorkArea = "inbound" | "pick" | "pack";

export type FloorStaffStatus =
  | "active"
  | "on_break"
  | "off_shift"
  | "suspended"
  | "terminated";

export interface SupervisorFloorStaffMember {
  shiftId: number;
  employeeId: string;
  employeeName: string;
  workArea: FloorWorkArea;
  floorStatus: FloorStaffStatus;
  startedAt: string;
  shiftMinutes: number;
  assignedByEmployeeId: string | null;
  assignedByName: string;
  currentFulfillmentJobId: string | null;
  currentOrderId: string | null;
  totalJobsCompleted: number;
  totalLinesPicked: number;
  totalUnitsProcessed: number;
  totalExceptionsRaised: number;
  totalShortPicks: number;
  isOnJob: boolean;
  isOnBreak: boolean;
}

export interface SupervisorFloorStaffSummary {
  inbound: number;
  pick: number;
  pack: number;
  total: number;
}

export interface SupervisorFloorStaffResponse {
  staff: SupervisorFloorStaffMember[];
  summary: SupervisorFloorStaffSummary;
  generatedAt: string;
}

export interface SupervisorAssignableStaffMember {
  employeeId: string;
  employeeName: string;
  floorStatus: FloorStaffStatus;
  workArea: FloorWorkArea | null;
  isClockedIn: boolean;
  currentFulfillmentJobId: string | null;
  currentOrderId: string | null;
  isAvailable: boolean;
}

export interface SupervisorAssignmentResult {
  message: string;
}

export type SupervisorInboundVarianceResolution =
  | "accept_variance"
  | "reject_line"
  | "recount_ordered";

export type SupervisorInboundReceiptLineStatus =
  | "pending"
  | "accepted"
  | "partial"
  | "rejected";

export interface SupervisorInboundVarianceLine {
  id: number;
  shipmentId: string;
  manifestLineId: number | null;
  productName: string;
  sku: string;
  declaredQuantity: number | null;
  receivedQuantity: number;
  damagedQuantity: number;
  acceptedQuantity: number;
  status: SupervisorInboundReceiptLineStatus;
  notes: string;
  hasVariance: boolean;
  needsApproval: boolean;
}

export interface SupervisorInboundApprovalSummary {
  id: string;
  status: string;
  sellerStoreName: string;
  sellerName: string;
  deliveryMethod: string;
  warehouseCode: string;
  manifestLineCount: number;
  referenceNotes: string;
  expectedArrivalAt: string | null;
  receivedAt: string | null;
  varianceLineCount: number;
  pendingVarianceCount: number;
  needsSignOff: boolean;
}

export interface SupervisorInboundApprovalDetail
  extends SupervisorInboundApprovalSummary {
  varianceLines: SupervisorInboundVarianceLine[];
  receiptLines: SupervisorInboundVarianceLine[];
}

export interface SupervisorInboundApprovalsResponse {
  approvals: SupervisorInboundApprovalSummary[];
  total: number;
}

export interface ResolvePickExceptionParams {
  exceptionId: number;
  resolution: SupervisorExceptionResolution;
  notes?: string;
  newLocationId?: number;
}

export type SupervisorInventoryTaskType = "recount" | "damage_claim";

export type SupervisorDamageLiability =
  | "vhotis"
  | "seller"
  | "carrier"
  | "disputed";

export type SupervisorDamageType =
  | "warehouse_fault"
  | "arrived_damaged"
  | "expired"
  | "pest"
  | "other";

export interface SupervisorStockBalanceSnapshot {
  id: number;
  locationId: number | null;
  locationCode: string;
  locationDetail: string;
  zone: "AMB" | "CHL" | "FRZ";
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityDamaged: number;
}

export interface SupervisorRecountTask {
  id: number;
  taskType: "recount";
  exceptionId: number;
  pickLineId: number;
  fulfillmentRequestId: string;
  orderId: string;
  exceptionType: PickExceptionType;
  productName: string;
  sku: string;
  locationId: number | null;
  locationCode: string;
  locationDetail: string;
  zone: "AMB" | "CHL" | "FRZ";
  balanceId: number | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityFound: number;
  quantityRequired: number;
  resolutionNotes: string;
  resolvedAt: string | null;
  resolvedByName: string;
  balance?: SupervisorStockBalanceSnapshot | null;
}

export interface SupervisorDamageClaimTask {
  id: number;
  taskType: "damage_claim";
  claimId: number;
  unitCode: string;
  productName: string;
  sku: string;
  locationId: number | null;
  locationCode: string;
  locationDetail: string;
  zone: "AMB" | "CHL" | "FRZ";
  quantityDamaged: number;
  damageType: SupervisorDamageType;
  liability: SupervisorDamageLiability;
  estimatedValue: string | null;
  photoEvidenceUrls: string[];
  notes: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt: string | null;
}

export interface SupervisorInventoryTasksSummary {
  pendingRecounts: number;
  pendingDamageClaims: number;
  total: number;
}

export interface SupervisorInventoryTasksResponse {
  recountTasks: SupervisorRecountTask[];
  damageClaims: SupervisorDamageClaimTask[];
  summary: SupervisorInventoryTasksSummary;
}

export interface SupervisorResolvedExceptionsResponse {
  exceptions: PickExceptionSummary[];
  total: number;
  days: number;
  limit: number;
  offset: number;
  resolutionCounts: Partial<Record<PickExceptionResolution, number>>;
}

export interface SupervisorManagerRosterMember {
  employeeId: string;
  employeeName: string;
  managementRole: ManagementRole;
  exceptionsResolvedToday: number;
  avgExceptionResolutionMinutes: number;
}

export interface SupervisorManagerInsights {
  dashboard: SupervisorDashboardStats;
  warehouseExceptionsResolvedToday: number;
  avgResolutionMinutesToday: number;
  supervisorRoster: SupervisorManagerRosterMember[];
  generatedAt: string;
}

export interface SupervisorDevicePreferences {
  managementRole: ManagementRole;
  canApproveExceptions: boolean;
  canOverrideStockCounts: boolean;
  canApproveInboundShipments: boolean;
  canManageAssignments: boolean;
  canApproveDamageClaims: boolean;
  deviceTokenRegistered: boolean;
  notifyExceptionsEnabled: boolean;
  exceptionsResolvedToday: number;
  avgExceptionResolutionMinutes: number;
}

export type SupervisorHomeSectionId =
  | "exceptions"
  | "floor"
  | "jobs"
  | "inbound"
  | "inventory";

export interface SupervisorHomeSection {
  id: SupervisorHomeSectionId;
  title: string;
  description: string;
  route: string;
  permission?: SupervisorPermissionKey;
  phase: number;
}
