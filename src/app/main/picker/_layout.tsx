import { Stack } from "expo-router";

export default function PickerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[jobId]" />
    </Stack>
  );
}
