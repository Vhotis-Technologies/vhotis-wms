import * as Notifications from "expo-notifications";
import { type Href, router } from "expo-router";
import { InteractionManager } from "react-native";

import { supervisorExceptionDetailHref } from "@/constants/supervisor";

const processedResponseKeys = new Set<string>();

function getResponseDedupeKey(
  response: Notifications.NotificationResponse,
): string {
  const { actionIdentifier, notification } = response;
  return `${notification.request.identifier}:${actionIdentifier}`;
}

function markResponseProcessed(
  response: Notifications.NotificationResponse,
): boolean {
  const key = getResponseDedupeKey(response);
  if (processedResponseKeys.has(key)) {
    return false;
  }
  processedResponseKeys.add(key);
  return true;
}

function parseExceptionId(data: Record<string, unknown>): number | null {
  const raw = data.exception_id ?? data.exceptionId;
  if (raw == null || raw === "") {
    return null;
  }
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function navigateToSupervisorException(exceptionId: number): void {
  router.push(supervisorExceptionDetailHref(exceptionId) as Href);
}

export async function configureSupervisorNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync("SUPERVISOR_EXCEPTION", [
    {
      identifier: "VIEW_EXCEPTION",
      buttonTitle: "View exception",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);
}

async function clearStoredNotificationResponse(): Promise<void> {
  try {
    await Notifications.clearLastNotificationResponseAsync();
  } catch {
    // Best-effort; stale responses are deduped in-session.
  }
}

function shouldOpenExceptionDetail(
  actionIdentifier: string,
  notificationType: unknown,
): boolean {
  if (notificationType !== "supervisor_pick_exception") {
    return false;
  }

  return (
    actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ||
    actionIdentifier === "VIEW_EXCEPTION"
  );
}

export async function handleSupervisorNotificationResponse(
  response: Notifications.NotificationResponse,
): Promise<void> {
  if (!markResponseProcessed(response)) {
    return;
  }

  const { actionIdentifier, notification } = response;
  const data = notification.request.content.data as Record<string, unknown>;
  const notificationId = notification.request.identifier;

  try {
    if (!shouldOpenExceptionDetail(actionIdentifier, data.type)) {
      return;
    }

    const exceptionId = parseExceptionId(data);
    if (!exceptionId) {
      return;
    }

    await new Promise<void>((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        navigateToSupervisorException(exceptionId);
        resolve();
      });
    });

    await Notifications.dismissNotificationAsync(notificationId);
  } finally {
    await clearStoredNotificationResponse();
  }
}

export function setupSupervisorNotificationListeners(): () => void {
  const processResponse = (response: Notifications.NotificationResponse) => {
    void handleSupervisorNotificationResponse(response);
  };

  Notifications.getLastNotificationResponseAsync()
    .then((lastResponse) => {
      if (lastResponse) {
        processResponse(lastResponse);
      }
    })
    .catch(() => {
      // Cold-start replay is best-effort.
    });

  const responseListener =
    Notifications.addNotificationResponseReceivedListener(processResponse);

  return () => {
    responseListener.remove();
  };
}
