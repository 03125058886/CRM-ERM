import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowRight, Eye, EyeOff } from "lucide-react-native";
import { validateLogin, type PendingVerification, type User } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { pendingStore, useAuth } from "@/lib/auth";
import { Button, Input, LogoMark, Screen } from "@/components/ui";
import { C, font } from "@/lib/theme";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    const errs = validateLogin({ email, password });
    if (Object.keys(errs).length) return setErrors(errs);
    setBusy(true);
    try {
      const r = await api<({ requiresVerification: true } & PendingVerification) | { token: string; user: User }>("/auth/login", { body: { email, password }, auth: false });
      if ("requiresVerification" in r) {
        pendingStore.set({ ...r, purpose: "verify" });
        router.push("/(auth)/verify");
        return;
      }
      await signIn(r.token, r.user);
      router.replace("/(app)/dashboard");
    } catch (e) {
      const ae = e as ApiError;
      if (ae.field === "email" || ae.field === "password") setErrors({ [ae.field]: ae.message });
      else Alert.alert("Sign in failed", ae.message);
    } finally { setBusy(false); }
  }

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: "center", marginBottom: 24 }}>
        <LogoMark size={56} />
        <Text style={[font.h1, { marginTop: 14 }]}>Welcome back</Text>
        <Text style={[font.muted, { marginTop: 4 }]}>Sign in to your workspace</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Input label="Email" value={email} onChangeText={(v) => { setEmail(v); setErrors({}); }} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input
          label="Password" value={password} onChangeText={(v) => { setPassword(v); setErrors({}); }} error={errors.password} secureTextEntry={!showPw} autoComplete="current-password" onSubmitEditing={submit}
          right={<Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>{showPw ? <EyeOff size={18} color={C.mist} /> : <Eye size={18} color={C.mist} />}</Pressable>}
        />
        <View style={{ alignItems: "flex-end", marginTop: -6, marginBottom: 10 }}>
          <Button title="Forgot password?" variant="link" onPress={() => router.push("/(auth)/forgot")} />
        </View>
        <Button title="Sign in" loading={busy} icon={<ArrowRight size={18} color="#fff" />} onPress={submit} />
        <View style={{ alignItems: "center", marginTop: 20 }}>
          <Text style={font.muted}>New here?</Text>
          <Button title="Start a free trial" variant="link" onPress={() => router.replace("/(auth)/choose-apps")} />
        </View>
      </Animated.View>
    </Screen>
  );
}
