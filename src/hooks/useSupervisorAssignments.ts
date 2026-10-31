import { useCallback, useState } from "react";

import type {
  FloorWorkArea,
  SupervisorAssignableStaffMember,
  SupervisorFloorStaffMember,
  SupervisorJobSummary,
} from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorAssignments() {
  const warehouseId = useAuthStore((state) => state.employee?.warehouse ?? 0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignableStaff, setAssignableStaff] = useState<
    SupervisorAssignableStaffMember[]
  >([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const loadAssignableStaff = useCallback(
    async (workArea?: FloorWorkArea) => {
      if (!warehouseId) {
        setAssignableStaff([]);
        return [];
      }

      setIsLoadingStaff(true);
      setError(null);

      try {
        const rows = await supervisorApi.listAssignableStaff({
          warehouseId,
          workArea,
        });
        setAssignableStaff(rows);
        return rows;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to load assignable staff.";
        setError(message);
        return [];
      } finally {
        setIsLoadingStaff(false);
      }
    },
    [warehouseId],
  );

  const assignWorkArea = useCallback(
    async (params: {
      employeeId: string;
      workArea: FloorWorkArea;
      notes?: string;
    }): Promise<SupervisorFloorStaffMember | null> => {
      if (!warehouseId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.assignWorkArea({
          ...params,
          warehouseId,
        });
        return result.member;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to assign work area.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [warehouseId],
  );

  const forceEndShift = useCallback(
    async (params: {
      employeeId: string;
      notes?: string;
    }): Promise<string | null> => {
      if (!warehouseId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.forceEndShift({
          ...params,
          warehouseId,
        });
        return result.message;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to clock out employee.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [warehouseId],
  );

  const reassignPickJob = useCallback(
    async (params: {
      jobId: string;
      pickerEmployeeId: string;
      notes?: string;
    }): Promise<SupervisorJobSummary | null> => {
      if (!warehouseId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.reassignPickJob({
          ...params,
          warehouseId,
        });
        return result.job;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to reassign picker.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [warehouseId],
  );

  const reassignPackJob = useCallback(
    async (params: {
      jobId: string;
      packerEmployeeId: string;
      notes?: string;
    }): Promise<SupervisorJobSummary | null> => {
      if (!warehouseId) {
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const result = await supervisorApi.reassignPackJob({
          ...params,
          warehouseId,
        });
        return result.job;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to reassign packer.";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [warehouseId],
  );

  return {
    assignableStaff,
    isLoadingStaff,
    isSubmitting,
    error,
    loadAssignableStaff,
    assignWorkArea,
    forceEndShift,
    reassignPickJob,
    reassignPackJob,
    clearError: () => setError(null),
  };
}
