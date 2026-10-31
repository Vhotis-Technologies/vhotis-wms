import { useCallback, useEffect, useState } from "react";

import type {
  PickExceptionSummary,
  ResolvePickExceptionParams,
  ResolvePickExceptionResult,
} from "@/interfaces/supervisor";
import { useSupervisor } from "@/hooks/useSupervisor";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorException(exceptionId: number | null) {
  const {
    warehouseId,
    hasPermission,
    refreshExceptions,
  } = useSupervisor();

  const [exception, setException] = useState<PickExceptionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canApprove = hasPermission("approve_exceptions");

  const loadException = useCallback(async () => {
    if (!exceptionId || !warehouseId) {
      setException(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await supervisorApi.getPickException(
        exceptionId,
        warehouseId,
      );
      setException(detail);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load exception details.";
      setError(message);
      setException(null);
    } finally {
      setIsLoading(false);
    }
  }, [exceptionId, warehouseId]);

  useEffect(() => {
    loadException();
  }, [loadException]);

  const resolveException = useCallback(
    async (
      params: Omit<ResolvePickExceptionParams, "exceptionId">,
    ): Promise<ResolvePickExceptionResult | null> => {
      if (!exceptionId || !warehouseId || !canApprove) {
        return null;
      }

      setIsResolving(true);
      setResolveError(null);
      setSuccessMessage(null);

      try {
        const result = await supervisorApi.resolvePickException(
          {
            exceptionId,
            ...params,
          },
          warehouseId,
        );
        setException(result.exception);
        setSuccessMessage(result.message);
        await refreshExceptions();
        return result;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to resolve exception.";
        setResolveError(message);
        return null;
      } finally {
        setIsResolving(false);
      }
    },
    [canApprove, exceptionId, refreshExceptions, warehouseId],
  );

  return {
    exception,
    isLoading,
    isResolving,
    error,
    resolveError,
    successMessage,
    canApprove,
    loadException,
    resolveException,
  };
}
