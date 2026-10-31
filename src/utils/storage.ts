import * as SecureStore from "expo-secure-store";

import type { WarehouseEmployee } from "@/interfaces/auth";

const ACCESS_KEY = "wms_access";
const REFRESH_KEY = "wms_refresh";
const EMPLOYEE_KEY = "wms_employee";

export async function saveAuthSession(
  access: string,
  refresh: string,
  employee: WarehouseEmployee,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
    SecureStore.setItemAsync(EMPLOYEE_KEY, JSON.stringify(employee)),
  ]);
}

export async function loadAuthSession(): Promise<{
  access: string | null;
  refresh: string | null;
  employee: WarehouseEmployee | null;
}> {
  const [access, refresh, employeeRaw] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
    SecureStore.getItemAsync(EMPLOYEE_KEY),
  ]);

  let employee: WarehouseEmployee | null = null;
  if (employeeRaw) {
    try {
      employee = JSON.parse(employeeRaw) as WarehouseEmployee;
    } catch {
      employee = null;
    }
  }

  return { access, refresh, employee };
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(EMPLOYEE_KEY),
  ]);
}

export async function getStoredAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}
