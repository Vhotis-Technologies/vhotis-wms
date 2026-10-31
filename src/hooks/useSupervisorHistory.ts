import { useCallback, useState } from "react";

import type {
  PickExceptionResolution,
  SupervisorResolvedExceptionsResponse,
} from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorHistory(initialDays = 7) {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [days, setDays] = useState(initialDays);
  const [resolution, setResolution] = useState<PickExceptionResolution | "all">(
    "all",
  );
  const [history, setHistory] =
    useState<SupervisorResolvedExceptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    if (!warehouseId) {
      setHistory(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await supervisorApi.listResolvedExceptions({
        warehouseId,
        days,
        limit: 50,
        resolution: resolution === "all" ? undefined : resolution,
      });
      setHistory(response);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load exception history.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [days, resolution, warehouseId]);

  return {
    history,
    days,
    setDays,
    resolution,
    setResolution,
    isLoading,
    error,
    refreshHistory,
  };
}
