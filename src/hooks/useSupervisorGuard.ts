import { type Href, router } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/store";

/**
 * Redirects non-supervisors away from supervisor routes.
 * Mount once in the supervisor stack layout.
 */
export function useSupervisorGuard() {
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const employee = useAuthStore((state) => state.employee);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/" as Href);
      return;
    }

    if (!employee?.is_supervisor) {
      router.replace("/main/LandingPageScreen" as Href);
    }
  }, [isAuthReady, isAuthenticated, employee?.is_supervisor]);
}
