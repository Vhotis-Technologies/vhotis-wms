import { useCallback, useState } from "react";

import type {
  SupervisorInboundApprovalDetail,
  SupervisorInboundApprovalsResponse,
  SupervisorInboundVarianceResolution,
} from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorInbound() {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [approvals, setApprovals] =
    useState<SupervisorInboundApprovalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshApprovals = useCallback(async () => {
    if (!warehouseId) {
      setApprovals(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await supervisorApi.listInboundApprovals(warehouseId);
      setApprovals(response);
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load inbound approvals.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId]);

  return {
    approvals,
    isLoading,
    error,
    refreshApprovals,
    warehouseId,
    clearError: () => setError(null),
  };
}

export function useSupervisorInboundApproval(shipmentId: string | null | undefined) {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [approval, setApproval] = useState<SupervisorInboundApprovalDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApproval = useCallback(async () => {
    if (!warehouseId || !shipmentId) {
      setApproval(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detail = await supervisorApi.getInboundApproval(
        shipmentId,
        warehouseId,
      );
      setApproval(detail);
    } catch (err) {
      setApproval(null);
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to load inbound approval.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId, warehouseId]);

  const approveVariance = useCallback(
    async (params: {
      receiptLineId: number;
      resolution: SupervisorInboundVarianceResolution;
      notes?: string;
    }) => {
      if (!warehouseId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.approveInboundVariance({
          ...params,
          warehouseId,
        });
        await loadApproval();
        return result;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to approve inbound variance.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadApproval, warehouseId],
  );

  const completeReceiving = useCallback(
    async (notes?: string) => {
      if (!warehouseId || !shipmentId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.completeInboundReceiving({
          shipmentId,
          notes,
          warehouseId,
        });
        setApproval(result.approval);
        return result;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to complete receiving.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [shipmentId, warehouseId],
  );

  return {
    approval,
    isLoading,
    isSubmitting,
    error,
    loadApproval,
    approveVariance,
    completeReceiving,
  };
}
