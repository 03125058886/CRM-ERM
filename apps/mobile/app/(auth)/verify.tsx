import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Mail, MessageSquareText, Phone, ShieldCheck } from "lucide-react-native";
import type { PendingVerification, User } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { pendingStore, selectionStore, useAuth } from "@/lib/auth";
import { OtpInput } from "@/components/OtpInput";
import { Button, Screen } from "@/components/ui";
import { C, font } from "@/lib/theme";

const CHANNELS = [
  { id: "sms", label: "SMS", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquareText },
  { id: "email", label: "Email", icon: Mail },
] as const;

export default function Verify() {
  const { signIn } = useAuth();
  const [pending, setPending] = useState(pendingStore.get());
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(value: string) {
    if (!pending || busy) return;
    setBusy(true); setError(false);
    try {
      const r = await api<{ token: string; user: User }>("/auth/verify", { body: { pendingId: pending.pendingId, code: value }, auth: false });
      pendingStore.clear(); selectionStore.clear();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await signIn(r.token, r.user);
      router.replace("/(app)/dashboard");
    } catch (e) {
      setError(true); setCode("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert("Verification failed", (e as ApiError).message);
    } finally { setBusy(false); }
  }

  async function resend(channel: (typeof CHANNELS)[number]["id"]) {
    if (!pending || cooldown > 0) return;
    try {
      const r = await api<PendingVerification>("/auth/resend", { body: { pendingId: pending.pendingId, channel }, auth: false });
      const next = { ...pending, ...r };
      pendingStore.set(next); setPending(next); setCooldown(30); setCode("");
    } catch (e) { Alert.alert("Could not resend", (e as ApiError).message); }
  }

  if (!pending) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Text style={[font.h2, { textAlign: "center" }]}>Nothing to verify</Text>
        <Text style={[font.muted, { textAlign: "center", marginTop: 6, marginBottom: 20 }]}>Your session expired or was already completed.</Text>
        <Button title="Sign in" onPress={() => router.replace("/(auth)/login")} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <Animated.View entering={ZoomIn.duration(400)} style={s.badge}><ShieldCheck size={30} color={C.primary} /></Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={[font.h1, { textAlign: "center" }]}>Verify your phone</Text>
        <Text style={[font.muted, { textAlign: "center", marginTop: 6, marginBottom: 28 }]}>Enter the 6-digit code we sent to <Text style={{ fontWeight: "700", color: C.ink }}>{pending.maskedPhone}</Text></Text>

        <OtpInput value={code} onChange={(v) => { setCode(v); setError(false); }} onComplete={verify} error={error} disabled={busy} />

        {pending.devCode && (
          <Pressable onPress={() => { setCode(pending.devCode!); verify(pending.devCode!); }} style={s.dev}>
            <Text style={{ fontSize: 12, color: C.ink, textAlign: "center" }}>Dev mode · tap to use code <Text style={{ fontWeight: "800", color: C.primary }}>{pending.devCode}</Text></Text>
          </Pressable>
        )}

        <Button title="Verify & continue" loading={busy} disabled={code.length < 6} style={{ marginTop: 24 }} onPress={() => verify(code)} />

        <View style={{ marginTop: 28, alignItems: "center" }}>
          <Text style={font.muted}>{cooldown > 0 ? `Didn't get it? Resend in ${cooldown}s` : "Didn't get it? Resend via"}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            {CHANNELS.map((c) => (
              <Pressable key={c.id} disabled={cooldown > 0} onPress={() => resend(c.id)} style={[s.chan, cooldown > 0 && { opacity: 0.4 }]}>
                <c.icon size={16} color={C.ink} /><Text style={{ fontSize: 13, fontWeight: "600", color: C.ink }}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  badge: { alignSelf: "center", width: 64, height: 64, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  dev: { marginTop: 16, borderWidth: 1, borderStyle: "dashed", borderColor: C.amber, backgroundColor: "#FFF7E6", borderRadius: 12, padding: 10 },
  chan: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
});
