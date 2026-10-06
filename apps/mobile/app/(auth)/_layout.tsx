import { Stack } from "expo-router";
import { C } from "@/lib/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.primary,
        headerTitleStyle: { color: C.ink, fontWeight: "700" },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: C.surface },
      }}
    >
      <Stack.Screen name="choose-apps" options={{ title: "Choose your apps" }} />
      <Stack.Screen name="signup" options={{ title: "Create account" }} />
      <Stack.Screen name="verify" options={{ title: "Verify phone" }} />
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="forgot" options={{ title: "Reset password" }} />
    </Stack>
  );
}
