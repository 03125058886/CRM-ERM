import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Check, Download, Search } from "lucide-react-native";
import { CATALOG, type User } from "@zuvora/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { iconFor } from "@/lib/icons";
import { Screen } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

const header = { headerShown: true, title: "Apps", headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" as const } };

/** App store: install / uninstall any of the 46 apps. */
export default function AppsScreen() {
  const { user, setUser } = useAuth();
  const u = user!;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const cats = useMemo(() => { const k = q.toLowerCase(); return CATALOG.map((c) => ({ ...c, apps: c.apps.filter((a) => !k || a.name.toLowerCase().includes(k)) })).filter((c) => c.apps.length); }, [q]);

  async function toggle(id: string) {
    const installed = u.apps.includes(id);
    const next = installed ? u.apps.filter((x) => x !== id) : [...u.apps, id];
    setBusy(id);
    try { const r = await api<{ user: User }>("/auth/me/apps", { method: "PUT", body: { apps: next } }); setUser(r.user); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
    catch (e) { Alert.alert("Error", (e as ApiError).message); } finally { setBusy(null); }
  }

  return (
    <>
      <Stack.Screen options={header} />
      <Screen>
        <Text style={font.h1}>Apps</Text>
        <Text style={[font.muted, { marginTop: 4 }]}>{u.apps.length} of 46 installed</Text>
        <View style={s.search}><Search size={16} color={C.mist} /><TextInput value={q} onChangeText={setQ} placeholder="Search apps…" placeholderTextColor={C.mist} style={{ flex: 1, fontSize: 14, color: C.ink }} /></View>
        {cats.map((cat) => (
          <View key={cat.id} style={{ marginTop: 20 }}>
            <Text style={[font.tiny, { marginBottom: 8 }]}>{cat.name}</Text>
            <View style={{ gap: 8 }}>
              {cat.apps.map((app, i) => {
                const Icon = iconFor(app.icon);
                const on = u.apps.includes(app.id);
                return (
                  <Animated.View key={app.id} entering={FadeInUp.delay(Math.min(i, 6) * 30)}>
                    <View style={s.row}>
                      <Pressable onPress={() => on && router.push(`/(app)/app/${app.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <View style={[s.icon, { backgroundColor: app.color }]}><Icon size={20} color="#fff" /></View>
                        <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: "700", color: C.ink }}>{app.name}</Text><Text numberOfLines={1} style={font.muted}>{app.blurb}</Text></View>
                      </Pressable>
                      <Pressable onPress={() => toggle(app.id)} disabled={busy === app.id} style={[s.btn, on ? { backgroundColor: C.white, borderWidth: 1, borderColor: C.line } : { backgroundColor: C.primary }, busy === app.id && { opacity: 0.5 }]}>
                        {on ? <Check size={14} color={C.ink} /> : <Download size={14} color="#fff" />}
                        <Text style={{ fontSize: 12, fontWeight: "700", color: on ? C.ink : "#fff" }}>{on ? "Installed" : "Install"}</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        ))}
      </Screen>
    </>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, paddingHorizontal: 12, height: 42, marginTop: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.white, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, padding: 10, ...shadow.soft },
  icon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  btn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
});
