import { useCallback, useState } from "react";

import type { SupervisorManagerInsights } from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorManagerInsights() {
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const isManager = employee?.supervisor_profile?.management_role === "manager";

  const [insights, setInsights] = useState<SupervisorManagerInsights | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshInsights = useCallback(async () => {
    if (!isManager || !warehouseId) {
      setInsights(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await supervisorApi.getManagerInsights(warehouseId);
      setInsights(response);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load manager insights.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isManager, warehouseId]);

  return {
    isManager,
    insights,
    isLoading,
    error,
    refreshInsights,
  };
}
