import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  SupervisorJobSegment,
  SupervisorJobSummary,
} from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export type SupervisorJobFilter = SupervisorJobSegment | "all";

function parseJobFilter(value: string | undefined): SupervisorJobFilter {
  if (
    value === "blocked" ||
    value === "picking" ||
    value === "ready_to_pack" ||
    value === "packing" ||
    value === "dispatch"
  ) {
    return value;
  }
  return "all";
}

export function useSupervisorJobs(initialSegment?: string) {
  const employee = useAuthStore((state) => state.employee);
  const isSupervisor = Boolean(employee?.is_supervisor);
  const warehouseId = employee?.warehouse ?? 0;

  const [segment, setSegment] = useState<SupervisorJobFilter>(() =>
    parseJobFilter(initialSegment),
  );
  const [jobs, setJobs] = useState<SupervisorJobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSegment(parseJobFilter(initialSegment));
  }, [initialSegment]);

  const refreshJobs = useCallback(async () => {
    if (!isSupervisor || !warehouseId) {
      setJobs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rows = await supervisorApi.listWarehouseJobs({
        warehouseId,
        segment,
      });
      setJobs(rows);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load warehouse jobs.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isSupervisor, segment, warehouseId]);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  const blockedJobs = useMemo(
    () => jobs.filter((job) => job.hasPendingExceptions),
    [jobs],
  );

  return {
    jobs,
    blockedJobs,
    segment,
    setSegment,
    isLoading,
    error,
    refreshJobs,
    isSupervisor,
    warehouseId,
  };
}
