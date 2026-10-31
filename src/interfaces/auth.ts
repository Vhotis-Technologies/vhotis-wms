export type WorkArea = "inbound" | "pick" | "pack";

export type ManagementRole = "supervisor" | "manager";

export interface SupervisorProfile {
  management_role: ManagementRole;
  can_approve_exceptions: boolean;
  can_override_stock_counts: boolean;
  can_approve_inbound_shipments: boolean;
  can_manage_assignments: boolean;
  can_approve_damage_claims: boolean;
  device_token_registered?: boolean;
  notify_exceptions_enabled?: boolean;
  exceptions_resolved_today: number;
  avg_exception_resolution_minutes: number;
}

export interface WarehouseShiftSession {
  id: number;
  employee_id: string;
  employee_name: string;
  warehouse_code: string;
  work_area: WorkArea;
  started_at: string;
  ended_at: string | null;
}

export interface WarehouseEmployee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  warehouse: number;
  warehouse_code: string;
  floor_status: string;
  current_fulfillment_job?: number | null;
  is_active: boolean;
  is_supervisor: boolean;
  supervisor_profile?: SupervisorProfile | null;
  active_shift: WarehouseShiftSession | null;
  device_id?: string;
  last_active_at?: string | null;
}

export interface SigninFormData {
  employee_id: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  employee: WarehouseEmployee;
}

export interface RefreshResponse {
  access: string;
  refresh: string;
}

export interface StartShiftResponse {
  employee: WarehouseEmployee;
  shift_id: number;
  work_area: WorkArea;
  started_at: string;
}

export interface ApiErrorBody {
  error?: string;
  detail?: string;
  message?: string;
}
