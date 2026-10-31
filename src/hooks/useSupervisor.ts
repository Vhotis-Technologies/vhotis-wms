import { useCallback, useMemo, useState } from "react";

import {
  buildSupervisorPulseTiles,
  formatSupervisorShiftLabel,
  formatStatsGeneratedLabel,
  supervisorHasPermission,
} from "@/constants/supervisor";
import type {
  PickExceptionSummary,
  SupervisorDashboardStats,
  SupervisorPermissionKey,
  SupervisorPulseTile,
} from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";
import { sortPickExceptions } from "@/utils/supervisorExceptions";

export function useSupervisor() {
  const employee = useAuthStore((state) => state.employee);
  const logout = useAuthStore((state) => state.logout);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  const isSupervisor = Boolean(employee?.is_supervisor);
  const profile = employee?.supervisor_profile ?? null;
  const warehouseId = employee?.warehouse ?? 0;
  const warehouseCode = employee?.warehouse_code ?? "";

  const [exceptions, setExceptions] = useState<PickExceptionSummary[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [exceptionsError, setExceptionsError] = useState<string | null>(null);

  const [stats, setStats] = useState<SupervisorDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const hasPermission = useMemo(
    () => (permission: SupervisorPermissionKey) =>
      supervisorHasPermission(employee, permission),
    [employee],
  );

  const canApproveExceptions = hasPermission("approve_exceptions");
  const canApproveInbound = hasPermission("approve_inbound_shipments");

  const refreshExceptions = useCallback(async () => {
    if (!isSupervisor || !warehouseId || !canApproveExceptions) {
      setExceptions([]);
      return;
    }

    setExceptionsLoading(true);
    setExceptionsError(null);

    try {
      const rows = await supervisorApi.listPendingExceptions(warehouseId);
      setExceptions(sortPickExceptions(rows));
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Unable to load exceptions.";
      setExceptionsError(message);
    } finally {
      setExceptionsLoading(false);
    }
  }, [canApproveExceptions, isSupervisor, warehouseId]);

  const refreshDashboard = useCallback(async () => {
    if (!isSupervisor || !warehouseId) {
      setStats(null);
      return;
    }

    setStatsLoading(true);
    setStatsError(null);

    try {
      const dashboard = await supervisorApi.getDashboardStats(warehouseId);
      setStats(dashboard);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Unable to load warehouse pulse.";
      setStatsError(message);
    } finally {
      setStatsLoading(false);
    }
  }, [isSupervisor, warehouseId]);

  const refreshHome = useCallback(async () => {
    await Promise.all([refreshDashboard(), refreshExceptions()]);
  }, [refreshDashboard, refreshExceptions]);

  const pendingExceptionCount =
    stats?.pendingExceptions ?? exceptions.length;
  const staleExceptionCount =
    stats?.staleExceptions ??
    exceptions.filter((item) => item.isStale).length;

  const pulseTiles: SupervisorPulseTile[] = useMemo(() => {
    if (!stats) {
      return [];
    }
    return buildSupervisorPulseTiles(stats, {
      canApproveExceptions,
      canApproveInbound,
    });
  }, [canApproveExceptions, canApproveInbound, stats]);

  const statsUpdatedLabel = formatStatsGeneratedLabel(stats?.generatedAt);

  return {
    employee,
    profile,
    isSupervisor,
    warehouseId,
    warehouseCode,
    shiftLabel: formatSupervisorShiftLabel(employee),
    hasPermission,
    logout,
    isLoading: isAuthLoading,
    exceptions,
    exceptionsLoading,
    exceptionsError,
    stats,
    statsLoading,
    statsError,
    pulseTiles,
    statsUpdatedLabel,
    pendingExceptionCount,
    staleExceptionCount,
    refreshExceptions,
    refreshDashboard,
    refreshHome,
  };
}
