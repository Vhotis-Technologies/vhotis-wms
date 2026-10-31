import { useCallback, useMemo, useState } from "react";

import type { SupervisorDevicePreferences } from "@/interfaces/supervisor";
import { useAuthStore } from "@/store";
import * as authApi from "@/store/api/authApi";
import * as supervisorApi from "@/store/api/supervisorApi";
import { ApiRequestError } from "@/store/api/client";

export function useSupervisorSettings() {
  const employee = useAuthStore((state) => state.employee);
  const warehouseId = employee?.warehouse ?? 0;
  const profile = employee?.supervisor_profile ?? null;

  const [preferences, setPreferences] =
    useState<SupervisorDevicePreferences | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notifyEnabled = useMemo(() => {
    if (preferences) {
      return preferences.notifyExceptionsEnabled;
    }
    return profile?.notify_exceptions_enabled ?? true;
  }, [preferences, profile?.notify_exceptions_enabled]);

  const deviceRegistered = useMemo(() => {
    if (preferences) {
      return preferences.deviceTokenRegistered;
    }
    return profile?.device_token_registered ?? false;
  }, [preferences, profile?.device_token_registered]);

  const updateNotifyPreference = useCallback(
    async (enabled: boolean) => {
      if (!warehouseId) {
        return false;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const result = await supervisorApi.updateSupervisorDevice({
          notifyExceptionsEnabled: enabled,
          warehouseId,
        });
        setPreferences(result.profile);
        setSuccessMessage(result.message);
        const { employee: refreshed } = await authApi.fetchCurrentEmployee();
        useAuthStore.setState({ employee: refreshed });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to update notification preferences.";
        setError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [warehouseId],
  );

  const registerDeviceToken = useCallback(
    async (deviceToken: string) => {
      if (!warehouseId || !deviceToken) {
        return false;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const result = await supervisorApi.updateSupervisorDevice({
          deviceToken,
          notifyExceptionsEnabled: true,
          warehouseId,
        });
        setPreferences(result.profile);
        setSuccessMessage("Push alerts enabled for this device.");
        const { employee: refreshed } = await authApi.fetchCurrentEmployee();
        useAuthStore.setState({ employee: refreshed });
        return true;
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : "Unable to register push token.";
        setError(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [warehouseId],
  );

  const clearDeviceToken = useCallback(async () => {
    if (!warehouseId) {
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await supervisorApi.updateSupervisorDevice({
        deviceToken: "",
        notifyExceptionsEnabled: false,
        warehouseId,
      });
      setPreferences(result.profile);
      setSuccessMessage("Push alerts disabled on this device.");
      const { employee: refreshed } = await authApi.fetchCurrentEmployee();
      useAuthStore.setState({ employee: refreshed });
      return true;
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to clear push token.";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [warehouseId]);

  return {
    profile,
    preferences,
    notifyEnabled,
    deviceRegistered,
    isSubmitting,
    error,
    successMessage,
    updateNotifyPreference,
    registerDeviceToken,
    clearDeviceToken,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
