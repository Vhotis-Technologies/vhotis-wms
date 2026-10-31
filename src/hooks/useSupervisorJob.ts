import { useCallback, useEffect, useState } from "react";

import type { SupervisorJobDetail } from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorJob(jobId: string | null | undefined) {
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const isSupervisor = Boolean(employee?.is_supervisor);

  const [job, setJob] = useState<SupervisorJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJob = useCallback(async () => {
    if (!isSupervisor || !warehouseId || !jobId) {
      setJob(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await supervisorApi.getSupervisorJob(jobId, warehouseId);
      setJob(detail);
    } catch (err) {
      setJob(null);
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load job inspection.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupervisor, jobId, warehouseId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  return {
    job,
    isLoading,
    error,
    refreshJob: loadJob,
    isSupervisor,
    warehouseId,
  };
}
