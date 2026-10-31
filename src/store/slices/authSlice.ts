import { create } from "zustand";

import type { SigninFormData, WarehouseEmployee } from "@/interfaces/auth";
import * as authApi from "@/store/api/authApi";
import { ApiRequestError } from "@/store/api/client";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "@/utils/storage";

interface AuthState {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  employee: WarehouseEmployee | null;
  access: string | null;
  refresh: string | null;
  loginFormData: SigninFormData;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;

  setRememberMe: (value: boolean) => void;
  updateLoginFormData: (key: keyof SigninFormData, value: string) => void;
  restoreSession: () => Promise<void>;
  login: (deviceId?: string) => Promise<void>;
  logout: () => Promise<void>;
  setEmployee: (employee: WarehouseEmployee) => Promise<void>;
  clearError: () => void;
}

const initialFormData: SigninFormData = {
  employee_id: "",
  password: "",
};

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isAuthReady: false,
  employee: null,
  access: null,
  refresh: null,
  loginFormData: initialFormData,
  isLoading: false,
  error: null,
  rememberMe: true,

  setRememberMe: (value) => set({ rememberMe: value }),

  updateLoginFormData: (key, value) =>
    set((state) => ({
      loginFormData: { ...state.loginFormData, [key]: value },
      error: null,
    })),

  clearError: () => set({ error: null }),

  /**
   * Restores the currently signed in employee session.
   * I
   * @returns 
   */
  restoreSession: async () => {
    try {
      const stored = await loadAuthSession();
      if (!stored.access || !stored.refresh) {
        return;
      }

      set({
        access: stored.access,
        refresh: stored.refresh,
        employee: stored.employee,
        isAuthenticated: true,
      });

      try {
        const { employee } = await authApi.fetchCurrentEmployee();
        set({ employee, isAuthenticated: true });
        await saveAuthSession(stored.access, stored.refresh, employee);
      } catch {
        const tokens = await authApi.refreshEmployeeToken(stored.refresh);
        const { employee } = await authApi.fetchCurrentEmployee();
        set({
          access: tokens.access,
          refresh: tokens.refresh,
          employee,
          isAuthenticated: true,
        });
        await saveAuthSession(tokens.access, tokens.refresh, employee);
      }
    } catch {
      await clearAuthSession();
      set({
        isAuthenticated: false,
        employee: null,
        access: null,
        refresh: null,
      });
    } finally {
      set({ isAuthReady: true });
    }
  },

  login: async (deviceId) => {
    const { loginFormData, rememberMe } = get();
    const employeeId = loginFormData.employee_id.trim();
    const password = loginFormData.password;

    if (!employeeId || !password) {
      set({ error: "Employee ID and password are required." });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await authApi.loginEmployee({
        employee_id: employeeId,
        password,
        device_id: deviceId,
      });

      set({
        isAuthenticated: true,
        employee: response.employee,
        access: response.access,
        refresh: response.refresh,
        loginFormData: initialFormData,
        isLoading: false,
        error: null,
        isAuthReady: true,
      });

      if (rememberMe) {
        await saveAuthSession(
          response.access,
          response.refresh,
          response.employee,
        );
      } else {
        await clearAuthSession();
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Unable to sign in. Check your connection and try again.";

      set({
        isLoading: false,
        error: message,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    const { refresh } = get();
    set({ isLoading: true });

    try {
      if (refresh) {
        await authApi.logoutEmployee(refresh);
      }
    } catch {
      // Still clear local session if server logout fails.
    } finally {
      await clearAuthSession();
      set({
        isAuthenticated: false,
        employee: null,
        access: null,
        refresh: null,
        loginFormData: initialFormData,
        isLoading: false,
        error: null,
        isAuthReady: true,
      });
    }
  },

  setEmployee: async (employee) => {
    const { access, refresh, rememberMe } = get();
    set({ employee });

    if (rememberMe && access && refresh) {
      await saveAuthSession(access, refresh, employee);
    }
  },
}));
