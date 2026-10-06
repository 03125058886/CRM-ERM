import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronRight } from "lucide-react-native";
import { APP_BY_ID, DASHBOARDS, moduleFor, type AppSummary, type DashboardSummary } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { iconFor } from "@/lib/icons";
import { Screen } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text numberOfLines={1} style={{ width: 96, fontSize: 12, color: C.slate }}>{r.label}</Text>
          <View style={{ flex: 1, height: 16, backgroundColor: C.surface, borderTopRightRadius: 4, borderBottomRightRadius: 4 }}>
            <View style={{ width: `${(r.value / max) * 100}%`, height: 16, backgroundColor: C.primary, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
          </View>
          <Text style={{ width: 48, textAlign: "right", fontSize: 12, fontWeight: "700", color: C.ink }}>{fmt(r.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function StageColumns({ stages }: { stages: { stage: string; count: number }[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 90, marginTop: 10 }}>
      {stages.map((s) => (
        <View key={s.stage} style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: C.ink, fontWeight: "700", marginBottom: 2 }}>{s.count}</Text>
          <View style={{ width: "70%", maxWidth: 28, height: Math.max(s.count > 0 ? 4 : 1, (s.count / max) * 56), backgroundColor: C.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
          <Text numberOfLines={1} style={{ fontSize: 9, color: C.slate, marginTop: 4 }}>{s.stage}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DashboardsScreen() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [dashId, setDashId] = useState(1);
  const dash = DASHBOARDS.find((d) => d.id === dashId) ?? DASHBOARDS[0];

  useEffect(() => {
    api<DashboardSummary>("/dashboards/summary").then(setData).catch((e: ApiError) => { Alert.alert("Dashboards", e.message); setData({ generatedAt: "", apps: [] }); });
  }, []);

  const apps: AppSummary[] = useMemo(() => {
    const list = data?.apps ?? [];
    return dash.apps.length ? list.filter((a) => dash.apps.includes(a.appId)) : list;
  }, [data, dash]);
  const totals = { records: apps.reduce((s, a) => s + a.count, 0), done: apps.reduce((s, a) => s + a.done, 0), amount: apps.reduce((s, a) => s + a.amount, 0) };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Dashboards", headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" } }} />
      <Screen>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0, marginBottom: 14 }}>
          {DASHBOARDS.map((d) => (
            <Pressable key={d.id} onPress={() => setDashId(d.id)} style={[s.chip, d.id === dashId && { backgroundColor: C.primary, borderColor: C.primary }]}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: d.id === dashId ? "#fff" : C.slate }}>{d.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Animated.View entering={FadeInDown.duration(350)}>
          <Text style={font.h1}>{dash.name}</Text>
          <Text style={[font.muted, { marginTop: 4, marginBottom: 14 }]}>{dash.description}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[{ l: "Records", v: totals.records }, { l: "Completed", v: totals.done }, { l: "Total value", v: totals.amount }].map((k) => (
              <View key={k.l} style={s.kpi}><Text style={font.tiny} numberOfLines={1}>{k.l}</Text><Text style={s.kpiV} numberOfLines={1}>{data ? fmt(k.v) : "–"}</Text></View>
            ))}
          </View>
        </Animated.View>

        {!data ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : apps.length === 0 ? (
          <Text style={[font.muted, { textAlign: "center", paddingVertical: 40 }]}>None of the {dash.name} apps are installed yet.</Text>
        ) : (
          <>
            <View style={[s.card, { marginTop: 16 }]}>
              <Text style={[font.h3, { marginBottom: 12 }]}>Records by app</Text>
              <Bars rows={apps.map((a) => ({ label: APP_BY_ID[a.appId].name, value: a.count }))} />
            </View>
            {apps.map((a, i) => {
              const app = APP_BY_ID[a.appId];
              const mod = moduleFor(a.appId);
              const Icon = iconFor(app.icon);
              return (
                <Animated.View key={a.appId} entering={FadeInDown.delay(Math.min(i, 8) * 50)} style={[s.card, { marginTop: 12 }]}>
                  <Pressable onPress={() => router.push(`/(app)/app/${a.appId}`)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={[s.icon, { backgroundColor: app.color }]}><Icon size={18} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={font.h3}>{app.name}</Text>
                      <Text style={font.muted}>{fmt(a.count)} {mod.nounPlural.toLowerCase()}{mod.amountLabel ? ` · ${fmt(a.amount)} ${mod.amountLabel.toLowerCase()}` : ""}</Text>
                    </View>
                    <ChevronRight size={18} color={C.mist} />
                  </Pressable>
                  <StageColumns stages={a.byStage} />
                </Animated.View>
              );
            })}
          </>
        )}
      </Screen>
    </>
  );
}

const s = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  kpi: { flex: 1, backgroundColor: C.white, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, padding: 10 },
  kpiV: { fontSize: 20, fontWeight: "800", color: C.ink, marginTop: 2 },
  card: { backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.line, padding: 16, ...shadow.soft },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
