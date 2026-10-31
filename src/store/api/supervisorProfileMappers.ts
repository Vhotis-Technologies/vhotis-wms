import type {
  PickExceptionResolution,
  SupervisorDevicePreferences,
  SupervisorManagerInsights,
  SupervisorManagerRosterMember,
  SupervisorResolvedExceptionsResponse,
} from "@/interfaces/supervisor";
import { mapPickExceptionSummaries } from "@/store/api/supervisorMappers";
import { mapSupervisorDashboardStats } from "@/store/api/supervisorDashboardMappers";

export function mapSupervisorDevicePreferences(
  record: {
    management_role: SupervisorDevicePreferences["managementRole"];
    can_approve_exceptions: boolean;
    can_override_stock_counts: boolean;
    can_approve_inbound_shipments: boolean;
    can_manage_assignments: boolean;
    can_approve_damage_claims: boolean;
    device_token_registered: boolean;
    notify_exceptions_enabled: boolean;
    exceptions_resolved_today: number;
    avg_exception_resolution_minutes: number;
  },
): SupervisorDevicePreferences {
  return {
    managementRole: record.management_role,
    canApproveExceptions: record.can_approve_exceptions,
    canOverrideStockCounts: record.can_override_stock_counts,
    canApproveInboundShipments: record.can_approve_inbound_shipments,
    canManageAssignments: record.can_manage_assignments,
    canApproveDamageClaims: record.can_approve_damage_claims,
    deviceTokenRegistered: record.device_token_registered,
    notifyExceptionsEnabled: record.notify_exceptions_enabled,
    exceptionsResolvedToday: record.exceptions_resolved_today,
    avgExceptionResolutionMinutes: record.avg_exception_resolution_minutes,
  };
}

export function mapResolvedExceptionsResponse(
  record: {
    exceptions: Parameters<typeof mapPickExceptionSummaries>[0];
    total: number;
    days: number;
    limit: number;
    offset: number;
    resolution_counts: Partial<Record<string, number>>;
  },
): SupervisorResolvedExceptionsResponse {
  const resolutionCounts: Partial<Record<PickExceptionResolution, number>> = {};
  for (const [key, value] of Object.entries(record.resolution_counts ?? {})) {
    resolutionCounts[key as PickExceptionResolution] = value;
  }

  return {
    exceptions: mapPickExceptionSummaries(record.exceptions),
    total: record.total,
    days: record.days,
    limit: record.limit,
    offset: record.offset,
    resolutionCounts,
  };
}

function mapManagerRosterMember(
  record: {
    employee_id: string;
    employee_name: string;
    management_role: SupervisorManagerRosterMember["managementRole"];
    exceptions_resolved_today: number;
    avg_exception_resolution_minutes: number;
  },
): SupervisorManagerRosterMember {
  return {
    employeeId: record.employee_id,
    employeeName: record.employee_name,
    managementRole: record.management_role,
    exceptionsResolvedToday: record.exceptions_resolved_today,
    avgExceptionResolutionMinutes: record.avg_exception_resolution_minutes,
  };
}

export function mapManagerInsights(
  record: {
    dashboard: Parameters<typeof mapSupervisorDashboardStats>[0];
    warehouse_exceptions_resolved_today: number;
    avg_resolution_minutes_today: number;
    supervisor_roster: Parameters<typeof mapManagerRosterMember>[0][];
    generated_at: string;
  },
): SupervisorManagerInsights {
  return {
    dashboard: mapSupervisorDashboardStats(record.dashboard),
    warehouseExceptionsResolvedToday: record.warehouse_exceptions_resolved_today,
    avgResolutionMinutesToday: record.avg_resolution_minutes_today,
    supervisorRoster: record.supervisor_roster.map(mapManagerRosterMember),
    generatedAt: record.generated_at,
  };
}
