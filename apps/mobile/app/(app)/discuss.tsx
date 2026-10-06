import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Bot, Hash, Plus, Send } from "lucide-react-native";
import type { Channel, Message } from "@zuvora/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { C, font, radius } from "@/lib/theme";

const header = { headerShown: true, title: "Discuss", headerShadowVisible: false, headerStyle: { backgroundColor: C.surface }, headerTintColor: C.primary, headerTitleStyle: { color: C.ink, fontWeight: "700" as const } };
const time = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function DiscussScreen() {
  const { user } = useAuth();
  const me = `${user!.firstName} ${user!.lastName}`.trim();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const list = useRef<FlatList<Message>>(null);

  useEffect(() => {
    api<{ channels: Channel[] }>("/discuss/channels").then((r) => { setChannels(r.channels); setActive((a) => a ?? r.channels[0]?.id ?? null); }).catch((e: ApiError) => Alert.alert("Discuss", e.message));
  }, []);
  useEffect(() => {
    if (active == null) return;
    api<{ messages: Message[] }>(`/discuss/channels/${active}/messages`).then((r) => setMessages(r.messages)).catch((e: ApiError) => Alert.alert("Discuss", e.message));
  }, [active]);

  async function send() {
    const body = text.trim();
    if (!body || active == null) return;
    setText("");
    const optimistic: Message = { id: -Date.now(), channelId: active, author: me, body, isBot: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    try {
      const r = await api<{ message: Message; extra: Message[] }>(`/discuss/channels/${active}/messages`, { body: { body } });
      setMessages((m) => [...m.filter((x) => x.id !== optimistic.id), r.message, ...r.extra]);
    } catch (e) { setMessages((m) => m.filter((x) => x.id !== optimistic.id)); Alert.alert("Could not send", (e as ApiError).message); }
  }

  function newChannel() {
    Alert.prompt?.("New channel", "Channel name", async (name) => {
      if (!name?.trim()) return;
      try { const r = await api<{ channel: Channel }>("/discuss/channels", { body: { name } }); setChannels((c) => [...c, r.channel]); setActive(r.channel.id); }
      catch (e) { Alert.alert("Error", (e as ApiError).message); }
    }) ?? Alert.alert("New channel", "Create channels from the web app on Android.");
  }

  return (
    <>
      <Stack.Screen options={header} />
      <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }} style={{ flexGrow: 0 }}>
            {channels.map((c) => (
              <Pressable key={c.id} onPress={() => setActive(c.id)} style={[s.chip, c.id === active && { backgroundColor: C.primary, borderColor: C.primary }]}>
                <Hash size={13} color={c.id === active ? "#fff" : C.slate} /><Text style={{ fontSize: 13, fontWeight: "600", color: c.id === active ? "#fff" : C.slate }}>{c.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={newChannel} style={s.chip}><Plus size={14} color={C.slate} /></Pressable>
          </ScrollView>

          <FlatList
            ref={list} data={messages} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: 16, gap: 10 }}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            renderItem={({ item: m }) => {
              const mine = !m.isBot && m.author === me;
              return (
                <Animated.View entering={FadeInUp.duration(250)} style={{ flexDirection: mine ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                  <View style={[s.avatar, m.isBot ? { backgroundColor: C.midnight } : mine ? { backgroundColor: C.primary } : { backgroundColor: C.slate }]}>
                    {m.isBot ? <Bot size={14} color="#fff" /> : <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{m.author.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</Text>}
                  </View>
                  <View style={{ maxWidth: "78%" }}>
                    <Text style={{ fontSize: 10, color: C.mist, textAlign: mine ? "right" : "left" }}>{m.author} · {time(m.createdAt)}</Text>
                    <View style={[s.bubble, mine ? { backgroundColor: C.primary, borderBottomRightRadius: 4 } : { backgroundColor: C.white, borderBottomLeftRadius: 4 }]}>
                      <Text style={{ fontSize: 14, color: mine ? "#fff" : C.ink }}>{m.body}</Text>
                    </View>
                  </View>
                </Animated.View>
              );
            }}
            ListEmptyComponent={<Text style={[font.muted, { textAlign: "center", marginTop: 40 }]}>No messages yet.</Text>}
          />

          <View style={s.composer}>
            <TextInput value={text} onChangeText={setText} placeholder={`Message #${channels.find((c) => c.id === active)?.name ?? ""}`} placeholderTextColor={C.mist} style={s.input} multiline onSubmitEditing={send} />
            <Pressable onPress={send} disabled={!text.trim()} style={[s.send, !text.trim() && { opacity: 0.4 }]}><Send size={18} color="#fff" /></Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2, borderWidth: 1, borderColor: C.line },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line },
  input: { flex: 1, maxHeight: 120, minHeight: 42, backgroundColor: C.surface, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.ink },
  send: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
});
