import { Stack } from "expo-router";

export default function PackerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[jobId]" />
    </Stack>
  );
}
