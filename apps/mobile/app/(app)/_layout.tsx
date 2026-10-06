import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { C } from "@/lib/theme";

export default function AppLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.surface }}><ActivityIndicator color={C.primary} /></View>;
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.surface }, animation: "slide_from_right" }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="settings" options={{ headerShown: true, title: "Settings", headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" } }} />
    </Stack>
  );
}
