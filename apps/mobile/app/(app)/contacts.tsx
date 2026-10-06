import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Building2, Mail, Phone, Plus, Search, Trash2, X } from "lucide-react-native";
import { COUNTRIES, type Contact } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { Button, Input, Screen, Select } from "@/components/ui";
import { C, font, radius, shadow } from "@/lib/theme";

const header = { headerShown: true, title: "Contacts", headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" as const } };
type Draft = { name: string; type: "person" | "company"; company: string; jobTitle: string; email: string; phone: string; city: string; country: string; tags: string; notes: string };
const empty: Draft = { name: "", type: "person", company: "", jobTitle: "", email: "", phone: "", city: "", country: "", tags: "", notes: "" };
const TAG_COLORS: Record<string, string> = { Customer: "#22D3A5", Prospect: "#8A7DFF", Vendor: "#FFB020", "My company": "#5B4BFF" };

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => { api<{ contacts: Contact[] }>("/contacts").then((r) => setContacts(r.contacts)).catch((e: ApiError) => Alert.alert("Contacts", e.message)); }, []);
  const filtered = useMemo(() => { const k = q.toLowerCase(); return contacts.filter((c) => !k || [c.name, c.company, c.email, c.phone].join(" ").toLowerCase().includes(k)); }, [contacts, q]);

  async function save() {
    if (!draft.name.trim()) return setErr("Name is required");
    setBusy(true);
    try {
      if (editing === "new") { const r = await api<{ contact: Contact }>("/contacts", { body: draft }); setContacts((l) => [...l, r.contact].sort((a, b) => a.name.localeCompare(b.name))); }
      else if (editing) { const r = await api<{ contact: Contact }>(`/contacts/${editing.id}`, { method: "PATCH", body: draft }); setContacts((l) => l.map((x) => (x.id === r.contact.id ? r.contact : x))); }
      setEditing(null);
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }
  function remove(c: Contact) {
    Alert.alert("Delete contact?", c.name, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
      try { await api(`/contacts/${c.id}`, { method: "DELETE" }); setContacts((l) => l.filter((x) => x.id !== c.id)); setEditing(null); } catch (e) { Alert.alert("Error", (e as ApiError).message); }
    } }]);
  }
  const initials = (n: string) => n.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <Stack.Screen options={header} />
      <Screen scroll={false} contentContainerStyle={{ padding: 0 }}>
        <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
          <View style={s.search}><Search size={16} color={C.mist} /><TextInput value={q} onChangeText={setQ} placeholder="Search contacts…" placeholderTextColor={C.mist} style={{ flex: 1, fontSize: 14, color: C.ink }} /></View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, gap: 10 }}>
          {filtered.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInUp.delay(Math.min(i, 8) * 40)}>
              <Pressable onPress={() => { setDraft({ ...c, tags: c.tags.join(", ") }); setErr(undefined); setEditing(c); }} style={s.card}>
                <View style={[s.avatar, { backgroundColor: c.type === "company" ? C.midnight : C.primary }]}>{c.type === "company" ? <Building2 size={18} color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>{initials(c.name)}</Text>}</View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: C.ink }}>{c.name}</Text>
                  {(c.jobTitle || c.company) ? <Text style={font.muted}>{[c.jobTitle, c.company].filter(Boolean).join(" · ")}</Text> : null}
                  {c.email ? <View style={s.row}><Mail size={12} color={C.mist} /><Text style={font.muted}>{c.email}</Text></View> : null}
                  {c.phone ? <View style={s.row}><Phone size={12} color={C.mist} /><Text style={font.muted}>{c.phone}</Text></View> : null}
                  {c.tags.length > 0 && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>{c.tags.map((t) => <View key={t} style={[s.tag, { backgroundColor: TAG_COLORS[t] ?? C.mist }]}><Text style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}>{t}</Text></View>)}</View>}
                </View>
              </Pressable>
            </Animated.View>
          ))}
          {filtered.length === 0 && <Text style={[font.muted, { textAlign: "center", paddingVertical: 40 }]}>No contacts.</Text>}
        </ScrollView>
        <Pressable onPress={() => { setDraft(empty); setErr(undefined); setEditing("new"); }} style={s.fab}><Plus size={26} color="#fff" /></Pressable>
      </Screen>

      <Modal visible={editing !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: C.surface }}>
          <View style={s.modalHead}><Text style={font.h3}>{editing === "new" ? "New contact" : "Edit contact"}</Text><Pressable onPress={() => setEditing(null)} hitSlop={10}><X size={22} color={C.slate} /></Pressable></View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {(["person", "company"] as const).map((t) => (
                <Pressable key={t} onPress={() => setDraft({ ...draft, type: t })} style={[s.typeBtn, draft.type === t && { borderColor: C.primary, backgroundColor: C.primarySoft }]}><Text style={{ fontWeight: "600", color: draft.type === t ? C.primary : C.slate }}>{t === "person" ? "Individual" : "Company"}</Text></Pressable>
              ))}
            </View>
            <Input label={draft.type === "company" ? "Company name" : "Full name"} value={draft.name} onChangeText={(v) => { setDraft({ ...draft, name: v }); setErr(undefined); }} error={err} autoFocus />
            {draft.type === "person" && <><Input label="Job title" value={draft.jobTitle} onChangeText={(v) => setDraft({ ...draft, jobTitle: v })} /><Input label="Company" value={draft.company} onChangeText={(v) => setDraft({ ...draft, company: v })} /></>}
            <Input label="Email" value={draft.email} onChangeText={(v) => setDraft({ ...draft, email: v })} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Phone" value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} keyboardType="phone-pad" />
            <Input label="City" value={draft.city} onChangeText={(v) => setDraft({ ...draft, city: v })} />
            <Select label="Country" value={draft.country} options={COUNTRIES} onChange={(v) => setDraft({ ...draft, country: v })} />
            <Input label="Tags" value={draft.tags} onChangeText={(v) => setDraft({ ...draft, tags: v })} hint="Comma separated" />
            <Input label="Notes" value={draft.notes} onChangeText={(v) => setDraft({ ...draft, notes: v })} multiline style={{ minHeight: 80, textAlignVertical: "top" }} />
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
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, paddingHorizontal: 12, height: 42 },
  card: { flexDirection: "row", gap: 12, backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1, borderColor: C.line, padding: 14, ...shadow.soft },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  fab: { position: "absolute", right: 20, bottom: 28, width: 58, height: 58, borderRadius: 29, backgroundColor: C.accent, alignItems: "center", justifyContent: "center", ...shadow.lift },
  typeBtn: { flex: 1, alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: radius.md, paddingVertical: 10, backgroundColor: C.white },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.white },
  modalFoot: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line },
  del: { width: 50, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
});
