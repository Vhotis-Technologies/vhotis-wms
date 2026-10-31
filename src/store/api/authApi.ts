import type {
  LoginResponse,
  RefreshResponse,
  SigninFormData,
  StartShiftResponse,
  WarehouseEmployee,
  WorkArea,
} from "@/interfaces/auth";
import { wmsFetch } from "@/store/api/client";

export function loginEmployee(
  payload: SigninFormData & { device_id?: string },
): Promise<LoginResponse> {
  return wmsFetch<LoginResponse>("/api/v3/wms/auth/login/", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      employee_id: payload.employee_id.trim().toUpperCase(),
      password: payload.password,
      device_id: payload.device_id,
    }),
  });
}

export function refreshEmployeeToken(
  refresh: string,
): Promise<RefreshResponse> {
  return wmsFetch<RefreshResponse>("/api/v3/wms/auth/refresh/", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ refresh }),
  });
}

export function logoutEmployee(refresh: string): Promise<{ message: string }> {
  return wmsFetch<{ message: string }>("/api/v3/wms/auth/logout/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
}

export function fetchCurrentEmployee(): Promise<{
  employee: WarehouseEmployee;
}> {
  return wmsFetch<{ employee: WarehouseEmployee }>("/api/v3/wms/auth/me/", {
    method: "GET",
  });
}

export function startEmployeeShift(payload: {
  work_area: WorkArea;
  device_id?: string;
}): Promise<StartShiftResponse> {
  return wmsFetch<StartShiftResponse>("/api/v3/wms/auth/start_shift/", {
    method: "POST",
    body: JSON.stringify({
      work_area: payload.work_area,
      device_id: payload.device_id,
    }),
  });
}
