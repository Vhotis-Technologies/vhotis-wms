import { useCallback, useEffect, useState } from "react";

import type { SupervisorFloorStaffMember } from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorFloorEmployee(
  employeeId: string | null | undefined,
) {
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const isSupervisor = Boolean(employee?.is_supervisor);

  const [member, setMember] = useState<SupervisorFloorStaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    if (!isSupervisor || !warehouseId || !employeeId) {
      setMember(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await supervisorApi.getEmployeeFloorDetail(
        employeeId,
        warehouseId,
      );
      setMember(detail);
    } catch (err) {
      setMember(null);
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load employee profile.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, isSupervisor, warehouseId]);

  useEffect(() => {
    void loadMember();
  }, [loadMember]);

  return {
    member,
    isLoading,
    error,
    refreshMember: loadMember,
  };
}
