import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react-native";
import { EVENT_COLORS, type CalendarEvent } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { Button, Input, Screen } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

const header = { headerShown: true, title: "Calendar", headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" as const } };
const pad = (n: number) => String(n).padStart(2, "0");
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
type Draft = { title: string; date: string; startTime: string; endTime: string; allDay: boolean; location: string; partner: string; notes: string; color: string };

export default function CalendarScreen() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editing, setEditing] = useState<CalendarEvent | "new" | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const gridStart = useMemo(() => { const d = new Date(cursor); d.setDate(1 - ((cursor.getDay() + 6) % 7)); return d; }, [cursor]);
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; }), [gridStart]);

  useEffect(() => {
    const from = cells[0].toISOString(); const to = new Date(cells[41].getTime() + 86_400_000).toISOString();
    api<{ events: CalendarEvent[] }>(`/calendar/events?from=${from}&to=${to}`).then((r) => setEvents(r.events)).catch((e: ApiError) => Alert.alert("Calendar", e.message));
  }, [cells]);

  const on = (d: Date) => events.filter((e) => sameDay(new Date(e.start), d));
  const dayEvents = on(selected).sort((a, b) => a.start.localeCompare(b.start));

  function openNew() {
    const d = selected;
    setDraft({ title: "", date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, startTime: "10:00", endTime: "11:00", allDay: false, location: "", partner: "", notes: "", color: EVENT_COLORS[0] });
    setErr(undefined); setEditing("new");
  }
  function openEdit(e: CalendarEvent) {
    const s = new Date(e.start), en = new Date(e.end);
    setDraft({ title: e.title, date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`, startTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`, endTime: `${pad(en.getHours())}:${pad(en.getMinutes())}`, allDay: e.allDay, location: e.location, partner: e.partner, notes: e.notes, color: e.color });
    setErr(undefined); setEditing(e);
  }
  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return setErr("Title is required");
    const start = new Date(`${draft.date}T${draft.allDay ? "00:00" : draft.startTime}:00`);
    const end = new Date(`${draft.date}T${draft.allDay ? "23:59" : draft.endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setErr("Use YYYY-MM-DD and HH:MM");
    setBusy(true);
    try {
      const body = { ...draft, start: start.toISOString(), end: end.toISOString() };
      if (editing === "new") { const r = await api<{ event: CalendarEvent }>("/calendar/events", { body }); setEvents((l) => [...l, r.event]); }
      else if (editing) { const r = await api<{ event: CalendarEvent }>(`/calendar/events/${editing.id}`, { method: "PATCH", body }); setEvents((l) => l.map((x) => (x.id === r.event.id ? r.event : x))); }
      setEditing(null);
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }
  function remove(e: CalendarEvent) {
    Alert.alert("Delete event?", e.title, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
      try { await api(`/calendar/events/${e.id}`, { method: "DELETE" }); setEvents((l) => l.filter((x) => x.id !== e.id)); setEditing(null); } catch (er) { Alert.alert("Error", (er as ApiError).message); }
    } }]);
  }

  return (
    <>
      <Stack.Screen options={header} />
      <Screen>
        <Animated.View entering={FadeInDown.duration(350)} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} style={s.nav}><ChevronLeft size={18} color={C.ink} /></Pressable>
          <Text style={[font.h2, { flex: 1, textAlign: "center" }]}>{cursor.toLocaleDateString([], { month: "long", year: "numeric" })}</Text>
          <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} style={s.nav}><ChevronRight size={18} color={C.ink} /></Pressable>
        </Animated.View>

        <View style={s.grid}>
          <View style={{ flexDirection: "row" }}>{DAYS.map((d, i) => <Text key={i} style={s.dow}>{d}</Text>)}</View>
          {Array.from({ length: 6 }, (_, r) => (
            <View key={r} style={{ flexDirection: "row" }}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const isSel = sameDay(d, selected); const isToday = sameDay(d, today);
                const evs = on(d);
                return (
                  <Pressable key={i} onPress={() => setSelected(d)} style={s.cell}>
                    <View style={[s.dayNum, isSel && { backgroundColor: C.primary }, isToday && !isSel && { borderWidth: 1.5, borderColor: C.primary }]}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: isSel ? "#fff" : inMonth ? C.ink : C.mist }}>{d.getDate()}</Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 2, marginTop: 2, height: 5 }}>
                      {evs.slice(0, 3).map((e) => <View key={e.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: e.color }} />)}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 18, marginBottom: 10 }}>
          <Text style={[font.h3, { flex: 1 }]}>{selected.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</Text>
          <Button title="New" variant="ghost" icon={<Plus size={16} color={C.ink} />} style={{ paddingVertical: 8, paddingHorizontal: 14 }} onPress={openNew} />
        </View>
        {dayEvents.length === 0 ? <Text style={font.muted}>Nothing scheduled.</Text> : dayEvents.map((e) => (
          <Pressable key={e.id} onPress={() => openEdit(e)} style={s.event}>
            <View style={{ width: 4, borderRadius: 2, backgroundColor: e.color }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.ink }}>{e.title}</Text>
              <Text style={font.muted}>{e.allDay ? "All day" : `${new Date(e.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${new Date(e.end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}{e.location ? ` · ${e.location}` : ""}</Text>
            </View>
          </Pressable>
        ))}
      </Screen>

      <Modal visible={editing !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}>
        {draft && (
          <View style={{ flex: 1, backgroundColor: C.surface }}>
            <View style={s.modalHead}><Text style={font.h3}>{editing === "new" ? "New event" : "Edit event"}</Text><Pressable onPress={() => setEditing(null)} hitSlop={10}><X size={22} color={C.slate} /></Pressable></View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
              <Input label="Title" value={draft.title} onChangeText={(v) => { setDraft({ ...draft, title: v }); setErr(undefined); }} error={err} autoFocus />
              <Input label="Date" value={draft.date} onChangeText={(v) => setDraft({ ...draft, date: v })} placeholder="YYYY-MM-DD" />
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><Text style={font.body}>All day</Text><Switch value={draft.allDay} onValueChange={(v) => setDraft({ ...draft, allDay: v })} trackColor={{ true: C.primary }} /></View>
              {!draft.allDay && (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}><Input label="Starts" value={draft.startTime} onChangeText={(v) => setDraft({ ...draft, startTime: v })} placeholder="HH:MM" /></View>
                  <View style={{ flex: 1 }}><Input label="Ends" value={draft.endTime} onChangeText={(v) => setDraft({ ...draft, endTime: v })} placeholder="HH:MM" /></View>
                </View>
              )}
              <Input label="Location" value={draft.location} onChangeText={(v) => setDraft({ ...draft, location: v })} />
              <Input label="With" value={draft.partner} onChangeText={(v) => setDraft({ ...draft, partner: v })} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: C.slate, marginBottom: 8 }}>Color</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                {EVENT_COLORS.map((c) => <Pressable key={c} onPress={() => setDraft({ ...draft, color: c })} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: draft.color === c ? 3 : 0, borderColor: C.ink }} />)}
              </View>
              <Input label="Notes" value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
            </ScrollView>
            <View style={s.modalFoot}>
              {editing !== "new" && editing && <Pressable onPress={() => remove(editing)} style={s.del}><Trash2 size={18} color={C.danger} /></Pressable>}
              <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => setEditing(null)} />
              <Button title={editing === "new" ? "Create" : "Save"} loading={busy} style={{ flex: 1 }} onPress={save} />
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  nav: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  grid: { backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.line, padding: 8, ...shadow.soft },
  dow: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: C.mist, paddingVertical: 6 },
  cell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  dayNum: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  event: { flexDirection: "row", gap: 10, backgroundColor: C.white, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, padding: 12, marginBottom: 8 },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.white },
  modalFoot: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line },
  del: { width: 50, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
});
