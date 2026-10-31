import { Stack } from "expo-router";

export default function SorterLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[shipmentId]" />
      <Stack.Screen name="line/[lineId]" />
    </Stack>
  );
}
