import { useEffect } from "react";

import { useAuthStore } from "@/store";

/**
 * Restores persisted WMS session on app launch.
 * Mount once near the root layout.
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return <>{children}</>;
}
