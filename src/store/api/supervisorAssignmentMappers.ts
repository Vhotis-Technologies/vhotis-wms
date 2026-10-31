import type {
  FloorWorkArea,
  SupervisorAssignableStaffMember,
  SupervisorFloorStaffMember,
  SupervisorJobSummary,
} from "@/interfaces/supervisor";
import { mapSupervisorFloorStaffMember } from "@/store/api/supervisorFloorMappers";
import { mapSupervisorJobSummary } from "@/store/api/supervisorJobMappers";

type RawAssignableStaffMember = {
  employee_id: string;
  employee_name: string;
  floor_status: SupervisorAssignableStaffMember["floorStatus"];
  work_area: FloorWorkArea | null;
  is_clocked_in: boolean;
  current_fulfillment_job_id: string | null;
  current_order_id: string | null;
  is_available: boolean;
};

export function mapAssignableStaffMember(
  record: RawAssignableStaffMember,
): SupervisorAssignableStaffMember {
  return {
    employeeId: record.employee_id,
    employeeName: record.employee_name,
    floorStatus: record.floor_status,
    workArea: record.work_area,
    isClockedIn: record.is_clocked_in,
    currentFulfillmentJobId: record.current_fulfillment_job_id,
    currentOrderId: record.current_order_id,
    isAvailable: record.is_available,
  };
}

export function mapAssignableStaffMembers(
  records: RawAssignableStaffMember[],
): SupervisorAssignableStaffMember[] {
  return records.map(mapAssignableStaffMember);
}

export function mapAssignWorkAreaResponse(record: {
  member: Parameters<typeof mapSupervisorFloorStaffMember>[0];
  message?: string;
}): { member: SupervisorFloorStaffMember; message: string } {
  return {
    member: mapSupervisorFloorStaffMember(record.member),
    message: record.message ?? "Work area assigned.",
  };
}

export function mapReassignJobResponse(record: {
  job: Parameters<typeof mapSupervisorJobSummary>[0];
  message?: string;
}): { job: SupervisorJobSummary; message: string } {
  return {
    job: mapSupervisorJobSummary(record.job),
    message: record.message ?? "Job reassigned.",
  };
}
