import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInRight, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, X } from "lucide-react-native";
import { APP_BY_ID, moduleFor, type RecordRow } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { iconFor } from "@/lib/icons";
import { Button, Input, Screen, Select } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

type Draft = { title: string; stage: string; amount: string; partner: string; notes: string };
const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

export default function AppWorkspace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = APP_BY_ID[id ?? ""];
  const mod = useMemo(() => moduleFor(id ?? ""), [id]);
  const [records, setRecords] = useState<RecordRow[] | null>(null);
  const [stage, setStage] = useState<string>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<RecordRow | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: "", stage: mod.stages[0], amount: "", partner: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    if (!app) return;
    api<{ records: RecordRow[] }>(`/apps/${app.id}/records`)
      .then((r) => setRecords(r.records))
      .catch((e: ApiError) => { Alert.alert(app.name, e.message); setRecords([]); });
  }, [app]);

  if (!app) return <Screen><Text style={font.h2}>Unknown app</Text><Button title="Back" variant="link" onPress={() => router.back()} /></Screen>;
  const Icon = iconFor(app.icon);
  const lastStage = mod.stages[mod.stages.length - 1];

  const filtered = (records ?? []).filter((r) => (stage === "all" || r.stage === stage) && (!q || r.title.toLowerCase().includes(q.toLowerCase()) || r.partner.toLowerCase().includes(q.toLowerCase())));
  const total = filtered.reduce((s, r) => s + (r.amount ?? 0), 0);

  function openNew() { setDraft({ title: "", stage: stage === "all" ? mod.stages[0] : stage, amount: "", partner: "", notes: "" }); setErr(undefined); setEditing("new"); }
  function openEdit(r: RecordRow) { setDraft({ title: r.title, stage: r.stage, amount: r.amount == null ? "" : String(r.amount), partner: r.partner, notes: r.notes }); setErr(undefined); setEditing(r); }

  async function save() {
    if (!draft.title.trim()) return setErr(`${mod.noun} name is required`);
    setBusy(true);
    try {
      const body = { ...draft, amount: draft.amount === "" ? null : Number(draft.amount) };
      if (editing === "new") {
        const r = await api<{ record: RecordRow }>(`/apps/${app.id}/records`, { body });
        setRecords((l) => [r.record, ...(l ?? [])]);
      } else if (editing) {
        const r = await api<{ record: RecordRow }>(`/records/${editing.id}`, { method: "PATCH", body });
        setRecords((l) => (l ?? []).map((x) => (x.id === r.record.id ? r.record : x)));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setEditing(null);
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }

  async function move(r: RecordRow, dir: 1 | -1) {
    const next = mod.stages[mod.stages.indexOf(r.stage) + dir];
    if (!next) return;
    Haptics.selectionAsync().catch(() => {});
    setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? { ...x, stage: next } : x)));
    try { const res = await api<{ record: RecordRow }>(`/records/${r.id}`, { method: "PATCH", body: { stage: next } }); setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? res.record : x))); }
    catch (e) { setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? r : x))); Alert.alert("Error", (e as ApiError).message); }
  }

  function remove(r: RecordRow) {
    Alert.alert(`Delete ${mod.noun.toLowerCase()}?`, r.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await api(`/records/${r.id}`, { method: "DELETE" }); setRecords((l) => (l ?? []).filter((x) => x.id !== r.id)); setEditing(null); }
        catch (e) { Alert.alert("Error", (e as ApiError).message); }
      } },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: app.name, headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" } }} />
      <Screen scroll={false} contentContainerStyle={{ padding: 0 }}>
        <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={[s.appIcon, { backgroundColor: app.color }]}><Icon size={24} color="#fff" /></View>
            <View style={{ flex: 1 }}><Text style={font.h2}>{app.name}</Text><Text style={font.muted}>{app.blurb}</Text></View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <View style={s.stat}><Text style={font.tiny}>{mod.nounPlural}</Text><Text style={s.statV}>{records ? filtered.length : "–"}</Text></View>
            <View style={s.stat}><Text style={font.tiny}>{lastStage}</Text><Text style={s.statV}>{records ? filtered.filter((r) => r.stage === lastStage).length : "–"}</Text></View>
            {mod.amountLabel && <View style={s.stat}><Text style={font.tiny} numberOfLines={1}>{mod.amountLabel}</Text><Text style={s.statV} numberOfLines={1}>{records ? fmt(total) : "–"}</Text></View>}
          </View>
          <View style={s.search}><Search size={16} color={C.mist} /><TextInput value={q} onChangeText={setQ} placeholder={`Search ${mod.nounPlural.toLowerCase()}…`} placeholderTextColor={C.mist} style={{ flex: 1, fontSize: 14, color: C.ink }} /></View>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }} style={{ flexGrow: 0 }}>
          {["all", ...mod.stages].map((st) => {
            const on = stage === st;
            const n = st === "all" ? (records ?? []).length : (records ?? []).filter((r) => r.stage === st).length;
            return (
              <Pressable key={st} onPress={() => setStage(st)} style={[s.chip, on && { backgroundColor: C.primary, borderColor: C.primary }]}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: on ? "#fff" : C.slate }}>{st === "all" ? "All" : st} · {n}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {!records ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, gap: 10 }}>
            {filtered.map((r, i) => {
              const idx = mod.stages.indexOf(r.stage);
              return (
                <Animated.View key={r.id} entering={FadeInRight.delay(Math.min(i, 8) * 40)} layout={Layout.springify()}>
                  <Pressable onPress={() => router.push(`/(app)/record/${r.id}`)} onLongPress={() => openEdit(r)} style={s.card}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: C.ink }}>{r.title}</Text>
                      {r.partner ? <Text style={font.muted}>{r.partner}</Text> : null}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <View style={s.stagePill}><Text style={{ fontSize: 11, fontWeight: "700", color: C.primary }}>{r.stage}</Text></View>
                        {r.amount != null && mod.amountLabel ? <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink }}>{fmt(r.amount)}</Text> : null}
                      </View>
                    </View>
                    <View style={{ gap: 4 }}>
                      <Pressable hitSlop={6} disabled={idx === 0} onPress={() => move(r, -1)} style={[s.arrow, idx === 0 && { opacity: 0.25 }]}><ChevronLeft size={16} color={C.ink} /></Pressable>
                      <Pressable hitSlop={6} disabled={idx === mod.stages.length - 1} onPress={() => move(r, 1)} style={[s.arrow, idx === mod.stages.length - 1 && { opacity: 0.25 }]}><ChevronRight size={16} color={C.ink} /></Pressable>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
            {filtered.length === 0 && <Text style={[font.muted, { textAlign: "center", paddingVertical: 40 }]}>No {mod.nounPlural.toLowerCase()} here.</Text>}
          </ScrollView>
        )}

        <Pressable onPress={openNew} style={s.fab}><Plus size={26} color="#fff" /></Pressable>
      </Screen>

      <Modal visible={editing !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: C.surface }}>
          <View style={s.modalHead}>
            <Text style={font.h3}>{editing === "new" ? `New ${mod.noun.toLowerCase()}` : `Edit ${mod.noun.toLowerCase()}`}</Text>
            <Pressable onPress={() => setEditing(null)} hitSlop={10}><X size={22} color={C.slate} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            <Input label={`${mod.noun} name`} value={draft.title} onChangeText={(v) => { setDraft({ ...draft, title: v }); setErr(undefined); }} error={err} autoFocus />
            <Select label="Stage" value={draft.stage} options={mod.stages.map((x) => ({ id: x, label: x }))} onChange={(v) => setDraft({ ...draft, stage: v })} />
            {mod.partnerLabel && <Input label={mod.partnerLabel} value={draft.partner} onChangeText={(v) => setDraft({ ...draft, partner: v })} />}
            {mod.amountLabel && <Input label={mod.amountLabel} value={draft.amount} onChangeText={(v) => setDraft({ ...draft, amount: v })} keyboardType="decimal-pad" />}
            <Input label="Notes" value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: "top" }} />
          </ScrollView>
          <View style={s.modalFoot}>
            {editing !== "new" && editing && <Pressable onPress={() => remove(editing)} style={s.del}><Trash2 size={18} color={C.danger} /></Pressable>}
            <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setEditing(null)} />
            <Button title={editing === "new" ? "Create" : "Save"} loading={busy} style={{ flex: 1 }} onPress={save} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  appIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stat: { flex: 1, backgroundColor: C.white, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, padding: 10 },
  statV: { fontSize: 20, fontWeight: "800", color: C.ink, marginTop: 2 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, paddingHorizontal: 12, marginTop: 12, height: 42 },
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.line, padding: 14, ...shadow.soft },
  stagePill: { backgroundColor: C.primarySoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  arrow: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: 20, bottom: 28, width: 58, height: 58, borderRadius: 29, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", ...shadow.lift },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.white },
  modalFoot: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line },
  del: { width: 50, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
});
