import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Check, LayoutDashboard, LogOut, Plus, Settings, X } from "lucide-react-native";
import { APP_BY_ID, BRAND, CATALOG, type User } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { iconFor } from "@/lib/icons";
import { Button, Hero, Screen } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

export default function Dashboard() {
  const { user, setUser, signOut } = useAuth();
  const u = user!;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(u.apps);
  const [busy, setBusy] = useState(false);
  const installed = useMemo(() => u.apps.map((id) => APP_BY_ID[id]).filter(Boolean), [u.apps]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  async function save() {
    setBusy(true);
    try {
      const r = await api<{ user: User }>("/auth/me/apps", { method: "PUT", body: { apps: draft } });
      setUser(r.user); setOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { Alert.alert("Could not save", (e as ApiError).message); }
    finally { setBusy(false); }
  }

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Hero style={{ padding: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{greeting},</Text>
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.4 }}>{u.firstName} 👋</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>{u.subdomain}{BRAND.domainSuffix}</Text>
            </View>
            <Pressable onPress={() => router.push("/(app)/dashboards")} style={s.iconBtn}><LayoutDashboard size={20} color="#fff" /></Pressable>
            <Pressable onPress={() => router.push("/(app)/settings")} style={s.iconBtn}><Settings size={20} color="#fff" /></Pressable>
            <Pressable onPress={() => Alert.alert("Sign out?", "", [{ text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => signOut().then(() => router.replace("/")) }])} style={s.iconBtn}><LogOut size={20} color="#fff" /></Pressable>
          </View>
        </Hero>
      </Animated.View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 }}>
        <Text style={font.h2}>Your apps <Text style={font.muted}>({installed.length})</Text></Text>
        <Button title="Add" variant="ghost" icon={<Plus size={16} color={C.ink} />} style={{ paddingVertical: 8, paddingHorizontal: 14 }} onPress={() => { setDraft(u.apps); setOpen(true); }} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {installed.map((app, i) => {
          const Icon = iconFor(app.icon);
          return (
            <Animated.View key={app.id} entering={FadeInUp.delay(Math.min(i, 10) * 50).springify().damping(18)} style={{ width: "30.5%" }}>
              <Pressable onPress={() => router.push(`/(app)/app/${app.id}`)} style={({ pressed }) => [s.app, pressed && { transform: [{ scale: 0.95 }] }]}>
                <View style={[s.appIcon, { backgroundColor: app.color }]}><Icon size={26} color="#fff" strokeWidth={2} /></View>
                <Text numberOfLines={1} style={s.appName}>{app.name}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
        {installed.length === 0 && <Text style={[font.muted, { textAlign: "center", width: "100%", paddingVertical: 40 }]}>No apps yet. Tap “Add” to get started.</Text>}
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: C.surface }}>
          <View style={s.modalHead}>
            <View><Text style={font.h3}>Manage apps</Text><Text style={font.muted}>{draft.length} selected</Text></View>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}><X size={22} color={C.slate} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {CATALOG.map((cat) => (
              <View key={cat.id} style={{ marginBottom: 18 }}>
                <Text style={[font.tiny, { marginBottom: 8 }]}>{cat.name}</Text>
                <View style={{ gap: 8 }}>
                  {cat.apps.map((app) => {
                    const Icon = iconFor(app.icon);
                    const on = draft.includes(app.id);
                    return (
                      <Pressable key={app.id} onPress={() => { Haptics.selectionAsync().catch(() => {}); setDraft((d) => (on ? d.filter((x) => x !== app.id) : [...d, app.id])); }} style={[s.row, on && { borderColor: C.primary, backgroundColor: C.primarySoft }]}>
                        <View style={[s.rowIcon, { backgroundColor: app.color }]}><Icon size={16} color="#fff" /></View>
                        <Text style={[font.body, { flex: 1, fontWeight: "600" }]}>{app.name}</Text>
                        {on && <Check size={18} color={C.primary} strokeWidth={3} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={s.modalFoot}>
            <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setOpen(false)} />
            <Button title="Save" loading={busy} style={{ flex: 1 }} onPress={save} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  app: { backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.line, padding: 12, alignItems: "center", ...shadow.soft },
  appIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 12, fontWeight: "700", color: C.ink, marginTop: 8 },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.white },
  modalFoot: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, padding: 10 },
  rowIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
});
