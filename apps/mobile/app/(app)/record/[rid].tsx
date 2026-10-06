import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Check, Send, Trash2 } from "lucide-react-native";
import { APP_BY_ID, moduleFor, type ModuleDef, type RecordNote, type RecordRow } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { Button, Input, Screen } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

type Draft = { title: string; stage: string; amount: string; partner: string; notes: string };
const when = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const stageColor = (stages: string[], s: string) => /lost|cancel|refus|fail/i.test(s) ? C.danger : stages.indexOf(s) === stages.length - 1 || /won|done|paid|solved/i.test(s) ? C.mint : C.primary;

/** Full-page record form with Odoo-style statusbar and chatter. */
export default function RecordScreen() {
  const { rid } = useLocalSearchParams<{ rid: string }>();
  const [record, setRecord] = useState<RecordRow | null>(null);
  const [mod, setMod] = useState<ModuleDef | null>(null);
  const [notes, setNotes] = useState<RecordNote[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState("");
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    api<{ record: RecordRow; module: ModuleDef; notes: RecordNote[] }>(`/records/${rid}`)
      .then((r) => { setRecord(r.record); setMod(r.module); setNotes(r.notes); setDraft({ title: r.record.title, stage: r.record.stage, amount: r.record.amount == null ? "" : String(r.record.amount), partner: r.record.partner, notes: r.record.notes }); })
      .catch((e: ApiError) => { Alert.alert("Error", e.message); router.back(); });
  }, [rid]);

  const app = record ? APP_BY_ID[record.appId] : null;

  async function save(extra?: Partial<Draft>) {
    if (!record || !draft) return;
    const d = { ...draft, ...extra };
    if (!d.title.trim()) return setErr("Name is required");
    setBusy(true);
    try {
      const r = await api<{ record: RecordRow; notes: RecordNote[] }>(`/records/${record.id}`, { method: "PATCH", body: { ...d, amount: d.amount === "" ? null : Number(d.amount) } });
      setRecord(r.record); setNotes(r.notes); setDraft(d);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }
  function remove() {
    if (!record) return;
    Alert.alert("Delete?", record.title, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await api(`/records/${record.id}`, { method: "DELETE" }); router.back(); } catch (e) { Alert.alert("Error", (e as ApiError).message); } } }]);
  }
  async function sendNote() {
    if (!record || !chat.trim()) return;
    const body = chat.trim(); setChat("");
    try { const r = await api<{ note: RecordNote }>(`/records/${record.id}/notes`, { body: { body } }); setNotes((n) => [...n, r.note]); }
    catch (e) { Alert.alert("Error", (e as ApiError).message); }
  }

  if (!record || !mod || !draft || !app) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.surface }}><ActivityIndicator color={C.primary} /></View>;
  const idx = mod.stages.indexOf(draft.stage);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: app.name, headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" }, headerRight: () => <Pressable onPress={remove} hitSlop={8}><Trash2 size={20} color={C.danger} /></Pressable> }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <Screen contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Statusbar */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ flexGrow: 0, marginBottom: 14 }}>
              {mod.stages.map((s, i) => {
                const active = i === idx, past = i < idx;
                return (
                  <Pressable key={s} onPress={() => { setDraft({ ...draft, stage: s }); save({ stage: s }); }} style={[st.stage, active && { backgroundColor: stageColor(mod.stages, s), borderColor: stageColor(mod.stages, s) }]}>
                    {past && <Check size={12} color={C.mint} />}
                    <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : past ? C.ink : C.slate }}>{s}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(300)} style={st.sheet}>
            <TextInput value={draft.title} onChangeText={(v) => { setDraft({ ...draft, title: v }); setErr(undefined); }} placeholder={`${mod.noun} name…`} placeholderTextColor={C.mist} style={st.title} />
            {err && <Text style={{ color: C.danger, fontSize: 12, marginBottom: 8 }}>{err}</Text>}
            {mod.partnerLabel && <Input label={mod.partnerLabel} value={draft.partner} onChangeText={(v) => setDraft({ ...draft, partner: v })} />}
            {mod.amountLabel && <Input label={mod.amountLabel} value={draft.amount} onChangeText={(v) => setDraft({ ...draft, amount: v })} keyboardType="decimal-pad" />}
            <Input label="Internal notes" value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} multiline style={{ minHeight: 90, textAlignVertical: "top" }} />
            <Text style={[font.muted, { marginBottom: 12 }]}>Created {when(record.createdAt)} · Updated {when(record.updatedAt)}</Text>
            <Button title="Save" loading={busy} icon={<Check size={18} color="#fff" />} onPress={() => save()} />
          </Animated.View>

          {/* Chatter */}
          <Animated.View entering={FadeInUp.delay(120).duration(300)} style={[st.sheet, { marginTop: 14 }]}>
            <Text style={[font.h3, { marginBottom: 10 }]}>Chatter <Text style={font.muted}>({notes.length})</Text></Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
              <TextInput value={chat} onChangeText={setChat} placeholder="Log a note…" placeholderTextColor={C.mist} multiline style={st.chatInput} />
              <Pressable onPress={sendNote} disabled={!chat.trim()} style={[st.send, !chat.trim() && { opacity: 0.4 }]}><Send size={16} color="#fff" /></Pressable>
            </View>
            {notes.slice().reverse().map((n) => (
              <View key={n.id} style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: n.kind === "log" ? C.mist : C.primary }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: C.mist }}><Text style={{ fontWeight: "700", color: C.slate }}>{n.author}</Text> · {when(n.createdAt)}</Text>
                  <Text style={[{ fontSize: 14, marginTop: 2 }, n.kind === "log" ? { color: C.slate } : { color: C.ink, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }]}>{n.body}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </Screen>
      </KeyboardAvoidingView>
    </>
  );
}

const st = StyleSheet.create({
  stage: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  sheet: { backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.line, padding: 16, ...shadow.soft },
  title: { fontSize: 22, fontWeight: "800", color: C.ink, marginBottom: 12, letterSpacing: -0.4 },
  chatInput: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: C.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: C.ink },
  send: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
});
