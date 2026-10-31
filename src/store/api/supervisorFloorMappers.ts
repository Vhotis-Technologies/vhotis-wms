import type {
  FloorStaffStatus,
  FloorWorkArea,
  SupervisorFloorStaffMember,
  SupervisorFloorStaffResponse,
  SupervisorFloorStaffSummary,
} from "@/interfaces/supervisor";

type RawFloorStaffMember = {
  shift_id: number;
  employee_id: string;
  employee_name: string;
  work_area: FloorWorkArea;
  floor_status: FloorStaffStatus;
  started_at: string;
  shift_minutes: number;
  assigned_by_employee_id: string | null;
  assigned_by_name?: string;
  current_fulfillment_job_id: string | null;
  current_order_id: string | null;
  total_jobs_completed: number;
  total_lines_picked: number;
  total_units_processed: number;
  total_exceptions_raised: number;
  total_short_picks: number;
  is_on_job: boolean;
  is_on_break: boolean;
};

type RawFloorStaffResponse = {
  staff: RawFloorStaffMember[];
  summary: SupervisorFloorStaffSummary;
  generated_at: string;
};

function mapFloorStaffMember(record: RawFloorStaffMember): SupervisorFloorStaffMember {
  return {
    shiftId: record.shift_id,
    employeeId: record.employee_id,
    employeeName: record.employee_name,
    workArea: record.work_area,
    floorStatus: record.floor_status,
    startedAt: record.started_at,
    shiftMinutes: record.shift_minutes,
    assignedByEmployeeId: record.assigned_by_employee_id,
    assignedByName: record.assigned_by_name ?? "",
    currentFulfillmentJobId: record.current_fulfillment_job_id,
    currentOrderId: record.current_order_id,
    totalJobsCompleted: record.total_jobs_completed,
    totalLinesPicked: record.total_lines_picked,
    totalUnitsProcessed: record.total_units_processed,
    totalExceptionsRaised: record.total_exceptions_raised,
    totalShortPicks: record.total_short_picks,
    isOnJob: record.is_on_job,
    isOnBreak: record.is_on_break,
  };
}

export function mapSupervisorFloorStaffResponse(
  record: RawFloorStaffResponse,
): SupervisorFloorStaffResponse {
  return {
    staff: record.staff.map(mapFloorStaffMember),
    summary: record.summary,
    generatedAt: record.generated_at,
  };
}

export function mapSupervisorFloorStaffMember(
  record: RawFloorStaffMember,
): SupervisorFloorStaffMember {
  return mapFloorStaffMember(record);
}

export function groupFloorStaffByArea(
  staff: SupervisorFloorStaffMember[],
): Record<FloorWorkArea, SupervisorFloorStaffMember[]> {
  return {
    inbound: staff.filter((member) => member.workArea === "inbound"),
    pick: staff.filter((member) => member.workArea === "pick"),
    pack: staff.filter((member) => member.workArea === "pack"),
  };
}
