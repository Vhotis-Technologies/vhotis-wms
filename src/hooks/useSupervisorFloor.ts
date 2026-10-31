import { useCallback, useMemo, useState } from "react";

import type { SupervisorFloorStaffResponse } from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";
import { groupFloorStaffByArea } from "@/store/api/supervisorFloorMappers";

export function useSupervisorFloor() {
  const employee = useAuthStore((state) => state.employee);
  const isSupervisor = Boolean(employee?.is_supervisor);
  const warehouseId = employee?.warehouse ?? 0;

  const [roster, setRoster] = useState<SupervisorFloorStaffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFloor = useCallback(async () => {
    if (!isSupervisor || !warehouseId) {
      setRoster(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await supervisorApi.listFloorStaff(warehouseId);
      setRoster(response);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load floor roster.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupervisor, warehouseId]);

  const groupedStaff = useMemo(
    () => groupFloorStaffByArea(roster?.staff ?? []),
    [roster?.staff],
  );

  return {
    roster,
    groupedStaff,
    isLoading,
    error,
    refreshFloor,
    isSupervisor,
    warehouseId,
  };
}
