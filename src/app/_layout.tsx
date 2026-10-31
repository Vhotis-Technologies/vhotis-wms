import { Stack } from "expo-router";

import AuthProvider from "../context/AuthProvider";
import ThemeProvider from "../context/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="main" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
