import { useEffect } from "react";

import {
  configureSupervisorNotificationCategories,
  setupSupervisorNotificationListeners,
} from "@/utils/supervisorNotificationHandler";

export default function SupervisorNotificationSetup() {
  useEffect(() => {
    void configureSupervisorNotificationCategories();
    return setupSupervisorNotificationListeners();
  }, []);

  return null;
}
