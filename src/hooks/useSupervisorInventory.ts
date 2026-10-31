import { useCallback, useState } from "react";

import type {
  SupervisorDamageClaimTask,
  SupervisorDamageLiability,
  SupervisorInventoryTasksResponse,
  SupervisorRecountTask,
} from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorInventory() {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [tasks, setTasks] = useState<SupervisorInventoryTasksResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    if (!warehouseId) {
      setTasks(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await supervisorApi.listInventoryTasks(warehouseId);
      setTasks(response);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load inventory tasks.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId]);

  return {
    tasks,
    isLoading,
    error,
    refreshTasks,
    warehouseId,
  };
}

export function useSupervisorRecountTask(
  exceptionId: number | null | undefined,
) {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [task, setTask] = useState<SupervisorRecountTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!warehouseId || !exceptionId) {
      setTask(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await supervisorApi.getRecountTask(exceptionId, warehouseId);
      setTask(detail);
    } catch (err) {
      setTask(null);
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load recount task.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [exceptionId, warehouseId]);

  const confirmCount = useCallback(
    async (params: { countedQty: number; notes?: string }) => {
      if (!warehouseId || !exceptionId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.confirmLocationCount({
          exceptionId,
          countedQty: params.countedQty,
          notes: params.notes,
          warehouseId,
        });
        setTask(result.task);
        return result;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to confirm location count.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [exceptionId, warehouseId],
  );

  return {
    task,
    isLoading,
    isSubmitting,
    error,
    loadTask,
    confirmCount,
  };
}

export function useSupervisorDamageClaim(claimId: number | null | undefined) {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [claim, setClaim] = useState<SupervisorDamageClaimTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClaim = useCallback(async () => {
    if (!warehouseId || !claimId) {
      setClaim(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await supervisorApi.getDamageClaimTask(claimId, warehouseId);
      setClaim(detail);
    } catch (err) {
      setClaim(null);
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load damage claim.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [claimId, warehouseId]);

  const approveClaim = useCallback(
    async (params: { liability: SupervisorDamageLiability; notes?: string }) => {
      if (!warehouseId || !claimId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.approveDamageClaim({
          claimId,
          liability: params.liability,
          notes: params.notes,
          warehouseId,
        });
        setClaim(result.claim);
        return result;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to approve damage claim.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [claimId, warehouseId],
  );

  return {
    claim,
    isLoading,
    isSubmitting,
    error,
    loadClaim,
    approveClaim,
  };
}
