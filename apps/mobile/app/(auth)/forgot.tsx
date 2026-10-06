import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { ArrowRight, KeyRound } from "lucide-react-native";
import { EMAIL_RE, type User } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { OtpInput } from "@/components/OtpInput";
import { Button, Input, Screen } from "@/components/ui";
import { C, font } from "@/lib/theme";

interface ForgotRes { sent: boolean; pendingId: string | null; maskedEmail: string; devCode?: string }

export default function Forgot() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<ForgotRes | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function request() {
    if (!EMAIL_RE.test(email)) return setError("Enter a valid email address");
    setBusy(true);
    try { setSent(await api<ForgotRes>("/auth/forgot", { body: { email }, auth: false })); }
    catch (e) { Alert.alert("Error", (e as ApiError).message); }
    finally { setBusy(false); }
  }

  async function reset() {
    if (!sent?.pendingId) return Alert.alert("No reset session", "Check the email you entered.");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setBusy(true);
    try {
      const r = await api<{ token: string; user: User }>("/auth/reset", { body: { pendingId: sent.pendingId, code, password }, auth: false });
      await signIn(r.token, r.user);
      router.replace("/(app)/dashboard");
    } catch (e) { setError((e as ApiError).message); }
    finally { setBusy(false); }
  }

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      {!sent ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={font.h1}>Reset your password</Text>
          <Text style={[font.muted, { marginTop: 4, marginBottom: 20 }]}>Enter your email and we will send you a code.</Text>
          <Input label="Email" value={email} onChangeText={(v) => { setEmail(v); setError(undefined); }} error={error} keyboardType="email-address" autoCapitalize="none" autoFocus />
          <Button title="Send code" loading={busy} icon={<ArrowRight size={18} color="#fff" />} onPress={request} />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInRight.duration(400)}>
          <Text style={font.h1}>Check your inbox</Text>
          <Text style={[font.muted, { marginTop: 4, marginBottom: 24 }]}>We emailed a 6-digit code to <Text style={{ fontWeight: "700", color: C.ink }}>{sent.maskedEmail}</Text></Text>
          <OtpInput value={code} onChange={(v) => { setCode(v); setError(undefined); }} error={Boolean(error)} />
          {sent.devCode && (
            <Pressable onPress={() => setCode(sent.devCode!)} style={{ marginTop: 14, borderWidth: 1, borderStyle: "dashed", borderColor: C.amber, backgroundColor: "#FFF7E6", borderRadius: 12, padding: 10 }}>
              <Text style={{ fontSize: 12, color: C.ink, textAlign: "center" }}>Dev mode · tap to use code <Text style={{ fontWeight: "800", color: C.primary }}>{sent.devCode}</Text></Text>
            </Pressable>
          )}
          <Input label="New password" value={password} onChangeText={(v) => { setPassword(v); setError(undefined); }} error={error} secureTextEntry hint="At least 8 characters" style={{}} />
          <Button title="Set new password" loading={busy} disabled={code.length < 6} icon={<KeyRound size={18} color="#fff" />} onPress={reset} />
          <Button title="Use a different email" variant="link" style={{ marginTop: 10 }} onPress={() => { setSent(null); setCode(""); setError(undefined); }} />
        </Animated.View>
      )}
    </Screen>
  );
}
