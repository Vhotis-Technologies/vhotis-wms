import type { SupervisorDashboardStats } from "@/interfaces/supervisor";

type SupervisorDashboardStatsRecord = {
  warehouse_id: number;
  warehouse_code: string;
  pending_exceptions: number;
  stale_exceptions: number;
  oldest_exception_minutes: number;
  blocked_jobs: number;
  pick_queue: number;
  pack_queue: number;
  inbound_receiving: number;
  dispatched_today: number;
  pending_inventory_tasks: number;
  pending_recounts: number;
  pending_damage_claims: number;
  staff_on_floor: {
    inbound: number;
    pick: number;
    pack: number;
    total: number;
  };
  generated_at: string;
};

export function mapSupervisorDashboardStats(
  record: SupervisorDashboardStatsRecord,
): SupervisorDashboardStats {
  return {
    warehouseId: record.warehouse_id,
    warehouseCode: record.warehouse_code,
    pendingExceptions: record.pending_exceptions,
    staleExceptions: record.stale_exceptions,
    oldestExceptionMinutes: record.oldest_exception_minutes,
    blockedJobs: record.blocked_jobs,
    pickQueue: record.pick_queue,
    packQueue: record.pack_queue,
    inboundReceiving: record.inbound_receiving,
    dispatchedToday: record.dispatched_today,
    pendingInventoryTasks: record.pending_inventory_tasks ?? 0,
    pendingRecounts: record.pending_recounts ?? 0,
    pendingDamageClaims: record.pending_damage_claims ?? 0,
    staffOnFloor: {
      inbound: record.staff_on_floor.inbound,
      pick: record.staff_on_floor.pick,
      pack: record.staff_on_floor.pack,
      total: record.staff_on_floor.total,
    },
    generatedAt: record.generated_at,
  };
}
