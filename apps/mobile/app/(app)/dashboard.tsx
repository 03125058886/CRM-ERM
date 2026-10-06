import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LogOut } from "lucide-react-native";
import { APP_BY_ID, BRAND, SYSTEM_APPS } from "@zuvora/shared";
import { useAuth } from "@/lib/auth";
import { iconFor } from "@/lib/icons";
import { Screen } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

const ROUTES: Record<string, string> = { discuss: "/(app)/discuss", calendar: "/(app)/calendar", contacts: "/(app)/contacts", dashboards: "/(app)/dashboards", apps: "/(app)/apps", settings: "/(app)/settings" };

/** Odoo-style home menu: system apps + installed apps. */
export default function Home() {
  const { user, signOut } = useAuth();
  const u = user!;
  const tiles = [
    ...SYSTEM_APPS.filter((a) => a.leading).map((a) => ({ ...a, href: ROUTES[a.id] })),
    ...u.apps.map((id) => APP_BY_ID[id]).filter(Boolean).map((a) => ({ id: a.id, name: a.name, icon: a.icon, color: a.color, href: `/(app)/app/${a.id}` })),
    ...SYSTEM_APPS.filter((a) => !a.leading).map((a) => ({ ...a, href: ROUTES[a.id] })),
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Screen contentContainerStyle={{ paddingTop: 12 }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }}>
        <View style={{ flex: 1 }}>
          <Text style={font.muted}>{greeting}, {u.firstName}</Text>
          <Text style={font.h2}>{u.company}</Text>
          <Text style={{ fontSize: 11, color: C.primary, fontFamily: "monospace", marginTop: 2 }}>{u.subdomain}{BRAND.domainSuffix}</Text>
        </View>
        <Pressable onPress={() => Alert.alert("Sign out?", "", [{ text: "Cancel", style: "cancel" }, { text: "Sign out", style: "destructive", onPress: () => signOut().then(() => router.replace("/")) }])} style={s.iconBtn}>
          <LogOut size={18} color={C.slate} />
        </Pressable>
      </Animated.View>

      <View style={s.dots} pointerEvents="none" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {tiles.map((t, i) => {
          const Icon = iconFor(t.icon);
          return (
            <Animated.View key={t.id} entering={FadeInUp.delay(Math.min(i, 12) * 40).springify().damping(18)} style={{ width: "30%" }}>
              <Pressable onPress={() => router.push(t.href as never)} style={({ pressed }) => [{ alignItems: "center" }, pressed && { transform: [{ scale: 0.94 }] }]}>
                <View style={s.tile}><View style={[s.tileIcon, { backgroundColor: t.color }]}><Icon size={26} color="#fff" strokeWidth={2} /></View></View>
                <Text numberOfLines={1} style={s.tileName}>{t.name}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  dots: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  tile: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center", ...shadow.soft },
  tileIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tileName: { fontSize: 12, fontWeight: "700", color: C.ink, marginTop: 8, textAlign: "center" },
});
