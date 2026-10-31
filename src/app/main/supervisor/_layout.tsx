import { Stack } from "expo-router";

import SupervisorNotificationSetup from "@/app/components/supervisor/SupervisorNotificationSetup";
import { useSupervisorGuard } from "@/hooks/useSupervisorGuard";
import { useSupervisorPush } from "@/hooks/useSupervisorPush";

export default function SupervisorLayout() {
  useSupervisorGuard();
  useSupervisorPush();

  return (
    <>
      <SupervisorNotificationSetup />
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history/index" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="exceptions/index" />
      <Stack.Screen name="exceptions/[exceptionId]" />
      <Stack.Screen name="jobs/index" />
      <Stack.Screen name="jobs/[jobId]" />
      <Stack.Screen name="floor/index" />
      <Stack.Screen name="floor/[employeeId]" />
      <Stack.Screen name="inbound/index" />
      <Stack.Screen name="inbound/[shipmentId]" />
      <Stack.Screen name="inventory/index" />
      <Stack.Screen name="inventory/recount/[exceptionId]" />
      <Stack.Screen name="inventory/damage/[claimId]" />
    </Stack>
    </>
  );
}
