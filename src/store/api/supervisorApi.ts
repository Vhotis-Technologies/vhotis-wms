import type {
  PickExceptionRecord,
  PickExceptionSummary,
  ResolvePickExceptionParams,
  ResolvePickExceptionResult,
  SupervisorAssignableStaffMember,
  SupervisorDashboardStats,
  FloorWorkArea,
  SupervisorFloorStaffMember,
  SupervisorFloorStaffResponse,
  SupervisorInboundApprovalDetail,
  SupervisorInboundApprovalsResponse,
  SupervisorInboundVarianceLine,
  SupervisorInboundVarianceResolution,
  SupervisorJobDetail,
  SupervisorJobSegment,
  SupervisorJobSummary,
  SupervisorDamageClaimTask,
  SupervisorDamageLiability,
  SupervisorInventoryTasksResponse,
  SupervisorManagerInsights,
  SupervisorRecountTask,
  SupervisorRelocateLocation,
  SupervisorResolvedExceptionsResponse,
  SupervisorDevicePreferences,
} from "@/interfaces/supervisor";
import { wmsFetch } from "@/store/api/client";
import {
  mapAssignableStaffMembers,
  mapAssignWorkAreaResponse,
  mapReassignJobResponse,
} from "@/store/api/supervisorAssignmentMappers";
import { mapSupervisorDashboardStats } from "@/store/api/supervisorDashboardMappers";
import { mapSupervisorJobSummaries } from "@/store/api/supervisorJobMappers";
import {
  mapInboundApprovalDetail,
  mapInboundApprovalsResponse,
  mapInboundVarianceLine,
} from "@/store/api/supervisorInboundMappers";
import {
  mapDamageClaimTask,
  mapInventoryTasksResponse,
  mapRecountTask,
} from "@/store/api/supervisorInventoryMappers";
import {
  mapManagerInsights,
  mapResolvedExceptionsResponse,
  mapSupervisorDevicePreferences,
} from "@/store/api/supervisorProfileMappers";
import { mapSupervisorJobDetail } from "@/store/api/supervisorJobDetailMappers";
import {
  mapSupervisorFloorStaffMember,
  mapSupervisorFloorStaffResponse,
} from "@/store/api/supervisorFloorMappers";
import {
  mapRelocateLocations,
  mapResolvedLocationScan,
} from "@/store/api/supervisorLocationMappers";
import {
  mapPickExceptionSummaries,
  mapPickExceptionSummary,
} from "@/store/api/supervisorMappers";

type ResolvePickExceptionResponse = {
  exception: PickExceptionRecord;
  pick_line_status: PickExceptionSummary["pickLineStatus"];
  fulfillment_request_id: string;
  message: string;
};

export function listPendingExceptions(
  warehouseId?: number,
): Promise<PickExceptionSummary[]> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  const query = params.toString();
  const url = query
    ? `/api/v3/ops/list_exceptions/?${query}`
    : "/api/v3/ops/list_exceptions/";
  return wmsFetch<PickExceptionRecord[]>(url).then(mapPickExceptionSummaries);
}

export function getDashboardStats(
  warehouseId?: number,
): Promise<SupervisorDashboardStats> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  const query = params.toString();
  const url = query
    ? `/api/v3/supervisor/dashboard_stats/?${query}`
    : "/api/v3/supervisor/dashboard_stats/";
  return wmsFetch<Parameters<typeof mapSupervisorDashboardStats>[0]>(url).then(
    mapSupervisorDashboardStats,
  );
}

type ListWarehouseJobsResponse = {
  jobs: Parameters<typeof mapSupervisorJobSummaries>[0];
};

export function listWarehouseJobs(params: {
  warehouseId?: number;
  segment?: SupervisorJobSegment | "all";
  blocked?: boolean;
}): Promise<SupervisorJobSummary[]> {
  const searchParams = new URLSearchParams();
  if (params.warehouseId) {
    searchParams.set("warehouse_id", String(params.warehouseId));
  }
  if (params.segment && params.segment !== "all") {
    searchParams.set("segment", params.segment);
  }
  if (params.blocked === true) {
    searchParams.set("blocked", "true");
  } else if (params.blocked === false) {
    searchParams.set("blocked", "false");
  }

  const query = searchParams.toString();
  const url = query
    ? `/api/v3/supervisor/list_warehouse_jobs/?${query}`
    : "/api/v3/supervisor/list_warehouse_jobs/";

  return wmsFetch<ListWarehouseJobsResponse>(url).then((response) =>
    mapSupervisorJobSummaries(response.jobs),
  );
}

export function getSupervisorJob(
  jobId: string,
  warehouseId?: number,
): Promise<SupervisorJobDetail> {
  const params = new URLSearchParams({ job_id: jobId });
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  return wmsFetch<Parameters<typeof mapSupervisorJobDetail>[0]>(
    `/api/v3/supervisor/get_supervisor_job/?${params.toString()}`,
  ).then(mapSupervisorJobDetail);
}

export function listFloorStaff(
  warehouseId?: number,
): Promise<SupervisorFloorStaffResponse> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  const query = params.toString();
  const url = query
    ? `/api/v3/supervisor/list_floor_staff/?${query}`
    : "/api/v3/supervisor/list_floor_staff/";
  return wmsFetch<Parameters<typeof mapSupervisorFloorStaffResponse>[0]>(url).then(
    mapSupervisorFloorStaffResponse,
  );
}

export function getEmployeeFloorDetail(
  employeeId: string,
  warehouseId?: number,
): Promise<SupervisorFloorStaffMember> {
  const params = new URLSearchParams({ employee_id: employeeId });
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  return wmsFetch<Parameters<typeof mapSupervisorFloorStaffMember>[0]>(
    `/api/v3/supervisor/get_employee_floor_detail/?${params.toString()}`,
  ).then(mapSupervisorFloorStaffMember);
}

type ListAssignableStaffResponse = {
  staff: Parameters<typeof mapAssignableStaffMembers>[0];
};

export function listAssignableStaff(params: {
  warehouseId?: number;
  workArea?: FloorWorkArea;
}): Promise<SupervisorAssignableStaffMember[]> {
  const searchParams = new URLSearchParams();
  if (params.warehouseId) {
    searchParams.set("warehouse_id", String(params.warehouseId));
  }
  if (params.workArea) {
    searchParams.set("work_area", params.workArea);
  }
  const query = searchParams.toString();
  const url = query
    ? `/api/v3/supervisor/list_assignable_staff/?${query}`
    : "/api/v3/supervisor/list_assignable_staff/";
  return wmsFetch<ListAssignableStaffResponse>(url).then((response) =>
    mapAssignableStaffMembers(response.staff),
  );
}

function supervisorPost<T>(path: string, body: Record<string, unknown>, warehouseId?: number) {
  return wmsFetch<T>(path, {
    method: "POST",
    body: JSON.stringify({
      warehouse_id: warehouseId,
      ...body,
    }),
  });
}

export function assignWorkArea(params: {
  employeeId: string;
  workArea: FloorWorkArea;
  notes?: string;
  warehouseId?: number;
}) {
  return supervisorPost<Parameters<typeof mapAssignWorkAreaResponse>[0]>(
    "/api/v3/supervisor/assign_work_area/",
    {
      employee_id: params.employeeId,
      work_area: params.workArea,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then(mapAssignWorkAreaResponse);
}

export function forceEndShift(params: {
  employeeId: string;
  notes?: string;
  warehouseId?: number;
}) {
  return supervisorPost<{ message: string }>(
    "/api/v3/supervisor/force_end_shift/",
    {
      employee_id: params.employeeId,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  );
}

export function reassignPickJob(params: {
  jobId: string;
  pickerEmployeeId: string;
  notes?: string;
  warehouseId?: number;
}) {
  return supervisorPost<Parameters<typeof mapReassignJobResponse>[0]>(
    "/api/v3/supervisor/reassign_pick_job/",
    {
      job_id: params.jobId,
      picker_employee_id: params.pickerEmployeeId,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then(mapReassignJobResponse);
}

export function reassignPackJob(params: {
  jobId: string;
  packerEmployeeId: string;
  notes?: string;
  warehouseId?: number;
}) {
  return supervisorPost<Parameters<typeof mapReassignJobResponse>[0]>(
    "/api/v3/supervisor/reassign_pack_job/",
    {
      job_id: params.jobId,
      packer_employee_id: params.packerEmployeeId,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then(mapReassignJobResponse);
}

export function listInboundApprovals(
  warehouseId?: number,
): Promise<SupervisorInboundApprovalsResponse> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  const query = params.toString();
  const url = query
    ? `/api/v3/supervisor/list_inbound_approvals/?${query}`
    : "/api/v3/supervisor/list_inbound_approvals/";
  return wmsFetch<Parameters<typeof mapInboundApprovalsResponse>[0]>(url).then(
    mapInboundApprovalsResponse,
  );
}

export function getInboundApproval(
  shipmentId: string,
  warehouseId?: number,
): Promise<SupervisorInboundApprovalDetail> {
  const params = new URLSearchParams({ shipment_id: shipmentId });
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  return wmsFetch<Parameters<typeof mapInboundApprovalDetail>[0]>(
    `/api/v3/supervisor/get_inbound_approval/?${params.toString()}`,
  ).then(mapInboundApprovalDetail);
}

export function approveInboundVariance(params: {
  receiptLineId: number;
  resolution: SupervisorInboundVarianceResolution;
  notes?: string;
  warehouseId?: number;
}): Promise<{ line: SupervisorInboundVarianceLine; message: string }> {
  return supervisorPost<{ line: Parameters<typeof mapInboundVarianceLine>[0]; message: string }>(
    "/api/v3/supervisor/approve_inbound_variance/",
    {
      receipt_line_id: params.receiptLineId,
      resolution: params.resolution,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then((response) => ({
    line: mapInboundVarianceLine(response.line),
    message: response.message,
  }));
}

export function completeInboundReceiving(params: {
  shipmentId: string;
  notes?: string;
  warehouseId?: number;
}): Promise<{ approval: SupervisorInboundApprovalDetail; message: string }> {
  return supervisorPost<{
    approval: Parameters<typeof mapInboundApprovalDetail>[0];
    message: string;
  }>(
    "/api/v3/supervisor/complete_inbound_receiving/",
    {
      shipment_id: params.shipmentId,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then((response) => ({
    approval: mapInboundApprovalDetail(response.approval),
    message: response.message,
  }));
}

export function listInventoryTasks(
  warehouseId?: number,
): Promise<SupervisorInventoryTasksResponse> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  const query = params.toString();
  const url = query
    ? `/api/v3/supervisor/list_inventory_tasks/?${query}`
    : "/api/v3/supervisor/list_inventory_tasks/";
  return wmsFetch<Parameters<typeof mapInventoryTasksResponse>[0]>(url).then(
    mapInventoryTasksResponse,
  );
}

export function getRecountTask(
  exceptionId: number,
  warehouseId?: number,
): Promise<SupervisorRecountTask> {
  const params = new URLSearchParams({
    exception_id: String(exceptionId),
  });
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  return wmsFetch<Parameters<typeof mapRecountTask>[0]>(
    `/api/v3/supervisor/get_recount_task/?${params.toString()}`,
  ).then(mapRecountTask);
}

export function getDamageClaimTask(
  claimId: number,
  warehouseId?: number,
): Promise<SupervisorDamageClaimTask> {
  const params = new URLSearchParams({
    claim_id: String(claimId),
  });
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  return wmsFetch<Parameters<typeof mapDamageClaimTask>[0]>(
    `/api/v3/supervisor/get_damage_claim/?${params.toString()}`,
  ).then(mapDamageClaimTask);
}

export function confirmLocationCount(params: {
  exceptionId: number;
  countedQty: number;
  notes?: string;
  warehouseId?: number;
}): Promise<{ task: SupervisorRecountTask; message: string }> {
  return supervisorPost<{ task: Parameters<typeof mapRecountTask>[0]; message: string }>(
    "/api/v3/supervisor/confirm_location_count/",
    {
      exception_id: params.exceptionId,
      counted_qty: params.countedQty,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then((response) => ({
    task: mapRecountTask(response.task),
    message: response.message,
  }));
}

export function overrideStockCount(params: {
  balanceId: number;
  countedQty: number;
  notes?: string;
  warehouseId?: number;
}): Promise<{ message: string }> {
  return supervisorPost<{ message: string }>(
    "/api/v3/supervisor/override_stock_count/",
    {
      balance_id: params.balanceId,
      counted_qty: params.countedQty,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  );
}

export function approveDamageClaim(params: {
  claimId: number;
  liability: SupervisorDamageLiability;
  notes?: string;
  warehouseId?: number;
}): Promise<{ claim: SupervisorDamageClaimTask; message: string }> {
  return supervisorPost<{
    claim: Parameters<typeof mapDamageClaimTask>[0];
    message: string;
  }>(
    "/api/v3/supervisor/approve_damage_claim/",
    {
      claim_id: params.claimId,
      liability: params.liability,
      notes: params.notes ?? "",
    },
    params.warehouseId,
  ).then((response) => ({
    claim: mapDamageClaimTask(response.claim),
    message: response.message,
  }));
}

export function listResolvedExceptions(params?: {
  warehouseId?: number;
  days?: number;
  limit?: number;
  offset?: number;
  resolution?: string;
}): Promise<SupervisorResolvedExceptionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.warehouseId) {
    searchParams.set("warehouse_id", String(params.warehouseId));
  }
  if (params?.days) {
    searchParams.set("days", String(params.days));
  }
  if (params?.limit) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.offset) {
    searchParams.set("offset", String(params.offset));
  }
  if (params?.resolution) {
    searchParams.set("resolution", params.resolution);
  }
  const query = searchParams.toString();
  const url = query
    ? `/api/v3/supervisor/list_resolved_exceptions/?${query}`
    : "/api/v3/supervisor/list_resolved_exceptions/";
  return wmsFetch<Parameters<typeof mapResolvedExceptionsResponse>[0]>(url).then(
    mapResolvedExceptionsResponse,
  );
}

export function getManagerInsights(
  warehouseId?: number,
): Promise<SupervisorManagerInsights> {
  const params = new URLSearchParams();
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  const query = params.toString();
  const url = query
    ? `/api/v3/supervisor/get_manager_insights/?${query}`
    : "/api/v3/supervisor/get_manager_insights/";
  return wmsFetch<Parameters<typeof mapManagerInsights>[0]>(url).then(
    mapManagerInsights,
  );
}

export function updateSupervisorDevice(params: {
  deviceToken?: string;
  notifyExceptionsEnabled?: boolean;
  warehouseId?: number;
}): Promise<{ profile: SupervisorDevicePreferences; message: string }> {
  return supervisorPost<{
    profile: Parameters<typeof mapSupervisorDevicePreferences>[0];
    message: string;
  }>(
    "/api/v3/supervisor/update_supervisor_device/",
    {
      ...(params.deviceToken !== undefined
        ? { device_token: params.deviceToken }
        : {}),
      ...(params.notifyExceptionsEnabled !== undefined
        ? { notify_exceptions_enabled: params.notifyExceptionsEnabled }
        : {}),
    },
    params.warehouseId,
  ).then((response) => ({
    profile: mapSupervisorDevicePreferences(response.profile),
    message: response.message,
  }));
}

export function getPickException(
  exceptionId: number,
  warehouseId?: number,
): Promise<PickExceptionSummary> {
  const params = new URLSearchParams({ exception_id: String(exceptionId) });
  if (warehouseId) {
    params.set("warehouse_id", String(warehouseId));
  }
  return wmsFetch<PickExceptionRecord>(
    `/api/v3/ops/get_exception/?${params.toString()}`,
  ).then(mapPickExceptionSummary);
}

export function resolvePickException(
  params: ResolvePickExceptionParams,
  warehouseId?: number,
): Promise<ResolvePickExceptionResult> {
  return wmsFetch<ResolvePickExceptionResponse>(
    "/api/v3/ops/resolve_exception/",
    {
      method: "POST",
      body: JSON.stringify({
        warehouse_id: warehouseId,
        exception_id: params.exceptionId,
        resolution: params.resolution,
        notes: params.notes ?? "",
        new_location_id: params.newLocationId,
      }),
    },
  ).then((response) => ({
    exception: mapPickExceptionSummary(response.exception),
    pickLineStatus: response.pick_line_status,
    fulfillmentRequestId: response.fulfillment_request_id,
    message: response.message,
  }));
}

type SearchRelocateLocationsResponse = {
  locations: {
    id: number;
    code: string;
    location_type: string;
    zone?: "AMB" | "CHL" | "FRZ";
    location_detail?: string;
    available_quantity: number;
  }[];
};

export function searchRelocateLocations(params: {
  exceptionId: number;
  warehouseId?: number;
  query?: string;
  limit?: number;
}): Promise<SupervisorRelocateLocation[]> {
  const searchParams = new URLSearchParams({
    exception_id: String(params.exceptionId),
  });
  if (params.warehouseId) {
    searchParams.set("warehouse_id", String(params.warehouseId));
  }
  if (params.query?.trim()) {
    searchParams.set("query", params.query.trim());
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  return wmsFetch<SearchRelocateLocationsResponse>(
    `/api/v3/ops/search_relocate_locations/?${searchParams.toString()}`,
  ).then((response) => mapRelocateLocations(response.locations));
}

export function resolveLocationScan(payload: string, warehouseId: number) {
  const params = new URLSearchParams({
    payload: payload.trim(),
    warehouse_id: String(warehouseId),
  });
  return wmsFetch<unknown>(
    `/api/v3/ops/resolve_scan/?${params.toString()}`,
  ).then((record) => mapResolvedLocationScan(record as never));
}
