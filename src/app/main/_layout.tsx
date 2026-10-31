import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LandingPageScreen" />
      <Stack.Screen name="picker" />
      <Stack.Screen name="sorter" />
      <Stack.Screen name="packer" />
      <Stack.Screen name="supervisor" />
    </Stack>
  );
}
