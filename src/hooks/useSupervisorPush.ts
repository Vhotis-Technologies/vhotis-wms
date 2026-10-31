import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

import * as supervisorApi from "@/store/api/supervisorApi";
import { useAuthStore } from "@/store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function resolveExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("supervisor-alerts", {
      name: "Supervisor alerts",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return token.data;
}

/**
 * Registers supervisor push token after login for exception alerts.
 */
export function useSupervisorPush() {
  const employee = useAuthStore((state) => state.employee);
  const isSupervisor = Boolean(employee?.is_supervisor);
  const canNotify = Boolean(employee?.supervisor_profile?.can_approve_exceptions);
  const warehouseId = employee?.warehouse ?? 0;
  const notifyEnabled =
    employee?.supervisor_profile?.notify_exceptions_enabled ?? true;
  const tokenRegistered =
    employee?.supervisor_profile?.device_token_registered ?? false;

  useEffect(() => {
    if (!isSupervisor || !canNotify || !warehouseId || !notifyEnabled) {
      return;
    }

    if (tokenRegistered) {
      return;
    }

    void (async () => {
      try {
        const pushToken = await resolveExpoPushToken();
        if (!pushToken) {
          return;
        }

        await supervisorApi.updateSupervisorDevice({
          deviceToken: pushToken,
          notifyExceptionsEnabled: true,
          warehouseId,
        });
      } catch {
        // Push registration is best-effort; settings screen allows retry.
      }
    })();
  }, [
    canNotify,
    isSupervisor,
    notifyEnabled,
    tokenRegistered,
    warehouseId,
  ]);
}

export { resolveExpoPushToken };
