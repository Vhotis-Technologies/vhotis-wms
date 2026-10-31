import { type Href, router } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";

import { FLOOR_LANDING_ROUTE } from "@/constants/routes";
import type { WorkArea } from "@/interfaces/auth";
import { useAuthStore } from "@/store";
import * as authApi from "@/store/api/authApi";
import { ApiRequestError } from "@/store/api/client";
import { useFloorStore } from "@/store/slices/floorSlice";

const WORK_AREA_LABELS: Record<WorkArea, string> = {
  pick: "Picking",
  pack: "Packing",
  inbound: "Inbound sorting",
};

export function formatWorkAreaLabel(area: WorkArea): string {
  return WORK_AREA_LABELS[area];
}

export function useFloorSession() {
  const employee = useAuthStore((state) => state.employee);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setEmployee = useAuthStore((state) => state.setEmployee);
  const logout = useAuthStore((state) => state.logout);
  const setWorkArea = useFloorStore((state) => state.setWorkArea);
  const clearWorkArea = useFloorStore((state) => state.clearWorkArea);

  const enterWorkArea = useCallback(
    async (area: WorkArea): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        const response = await authApi.startEmployeeShift({
          work_area: area,
          device_id: employee?.device_id,
        });
        await setEmployee(response.employee);
        setWorkArea(area);
        return { ok: true };
      } catch (error) {
        const message =
          error instanceof ApiRequestError
            ? error.message
            : "Unable to start shift. Check your connection and try again.";
        return { ok: false, error: message };
      }
    },
    [employee?.device_id, setEmployee, setWorkArea],
  );

  const changeWorkArea = useCallback(() => {
    clearWorkArea();
    router.replace(FLOOR_LANDING_ROUTE);
  }, [clearWorkArea]);

  const signOut = useCallback(() => {
    const hasActiveJob = Boolean(employee?.current_fulfillment_job);

    Alert.alert(
      "Sign out",
      hasActiveJob
        ? "You have an active job in progress. Signing out will end your shift and clear your session."
        : "This will end your shift and sign you out.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void (async () => {
              clearWorkArea();
              await logout();
              router.replace("/" as Href);
            })();
          },
        },
      ],
    );
  }, [clearWorkArea, employee?.current_fulfillment_job, logout]);

  return {
    employee,
    isLoading,
    enterWorkArea,
    changeWorkArea,
    signOut,
    formatWorkAreaLabel,
  };
}
