import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

import { SUPERVISOR_HOME_POLL_MS } from "@/constants/supervisor";

export function useSupervisorHomePolling(refreshHome: () => Promise<void>) {
  const refreshRef = useRef(refreshHome);
  refreshRef.current = refreshHome;

  useFocusEffect(
    useCallback(() => {
      void refreshRef.current();

      const intervalId = setInterval(() => {
        void refreshRef.current();
      }, SUPERVISOR_HOME_POLL_MS);

      return () => {
        clearInterval(intervalId);
      };
    }, []),
  );
}
