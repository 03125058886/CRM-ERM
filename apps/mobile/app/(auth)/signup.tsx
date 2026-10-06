import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Eye, EyeOff, Zap } from "lucide-react-native";
import {
  ALL_APPS, BRAND, COMPANY_SIZES, COUNTRIES, INTERESTS, LANGUAGES, slugify, validateSignup,
  type FieldErrors, type PendingVerification, type SignupPayload,
} from "@zuvora/shared";
import { api, ApiError } from "@/lib/api";
import { pendingStore, selectionStore } from "@/lib/auth";
import { iconFor } from "@/lib/icons";
import { Button, Card, Checkbox, Input, Radio, Screen, Select } from "@/components/ui";
import { C, font } from "@/lib/theme";

type Form = Omit<SignupPayload, "apps">;
const initial: Form = { firstName: "", lastName: "", company: "", subdomain: "", email: "", phone: "", password: "", country: "PK", language: "en", companySize: "", interest: "company", acceptTerms: false };

export default function Signup() {
  const apps = selectionStore.get();
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<FieldErrors<SignupPayload>>({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [domain, setDomain] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const slugTouched = useRef(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => { if (!slugTouched.current) setForm((f) => ({ ...f, subdomain: slugify(f.company) })); }, [form.company]);
  useEffect(() => {
    if (!form.subdomain) { setDomain("idle"); return; }
    setDomain("checking");
    const t = setTimeout(async () => {
      try { const r = await api<{ available: boolean }>(`/auth/check-subdomain?name=${encodeURIComponent(form.subdomain)}`, { auth: false }); setDomain(r.available ? "ok" : "taken"); }
      catch { setDomain("idle"); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.subdomain]);

  async function submit() {
    const payload: SignupPayload = { ...form, apps };
    const errs = validateSignup(payload);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setBusy(true);
    try {
      const r = await api<PendingVerification>("/auth/signup", { body: payload, auth: false });
      pendingStore.set({ ...r, purpose: "verify" });
      router.push("/(auth)/verify");
    } catch (e) {
      const ae = e as ApiError;
      if (ae.field) setErrors((x) => ({ ...x, [ae.field as keyof SignupPayload]: ae.message }));
      else Alert.alert("Could not sign up", ae.message);
    } finally { setBusy(false); }
  }

  const chosen = apps.map((id) => ALL_APPS.find((a) => a.id === id)!).filter(Boolean);

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={font.h1}>Create your account</Text>
        <Text style={[font.muted, { marginTop: 4, marginBottom: 16 }]}>Free instant access. No credit card required.</Text>

        <Card style={{ marginBottom: 18 }}>
          <Text style={font.tiny}>Your apps · {chosen.length}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {chosen.map((a) => { const I = iconFor(a.icon); return (
              <View key={a.id} style={s.chip}><View style={[s.chipIcon, { backgroundColor: a.color }]}><I size={12} color="#fff" /></View><Text style={s.chipText}>{a.name}</Text></View>
            ); })}
            <Pressable onPress={() => router.back()}><Text style={[s.chipText, { color: C.primary, paddingVertical: 6 }]}>Change</Text></Pressable>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Input label="First name" value={form.firstName} onChangeText={(v) => set("firstName", v)} error={errors.firstName} autoComplete="given-name" />
        <Input label="Last name" value={form.lastName} onChangeText={(v) => set("lastName", v)} error={errors.lastName} autoComplete="family-name" />
        <Input label="Company name" value={form.company} onChangeText={(v) => set("company", v)} error={errors.company} />
        <Input
          label="Your domain" value={form.subdomain} suffix={BRAND.domainSuffix} autoCapitalize="none" autoCorrect={false}
          onChangeText={(v) => { slugTouched.current = true; set("subdomain", slugify(v)); }}
          error={errors.subdomain ?? (domain === "taken" ? "Already taken" : undefined)}
          hint={domain === "ok" ? "✓ Available" : domain === "checking" ? "Checking…" : "Where your team will sign in"}
        />
        <Input label="Email" value={form.email} onChangeText={(v) => set("email", v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Phone number" value={form.phone} onChangeText={(v) => set("phone", v)} error={errors.phone} keyboardType="phone-pad" placeholder="+92 300 1234567" hint="We'll text you a verification code" autoComplete="tel" />
        <Input
          label="Password" value={form.password} onChangeText={(v) => set("password", v)} error={errors.password} secureTextEntry={!showPw} autoComplete="new-password" hint="At least 8 characters"
          right={<Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>{showPw ? <EyeOff size={18} color={C.mist} /> : <Eye size={18} color={C.mist} />}</Pressable>}
        />
        <Select label="Country" value={form.country} options={COUNTRIES} onChange={(v) => set("country", v)} error={errors.country} />
        <Select label="Language" value={form.language} options={LANGUAGES} onChange={(v) => set("language", v)} error={errors.language} />
        <Select label="Company size" value={form.companySize} options={COMPANY_SIZES} onChange={(v) => set("companySize", v)} error={errors.companySize} placeholder="Select company size" />
        <Radio label="Primary interest" value={form.interest} options={INTERESTS} onChange={(v) => set("interest", v)} />

        <Checkbox checked={form.acceptTerms} onChange={(v) => set("acceptTerms", v)}>
          By tapping <Text style={{ fontWeight: "700", color: C.ink }}>Start now</Text>, you accept our <Text style={{ color: C.primary }}>Subscription Agreement</Text> and <Text style={{ color: C.primary }}>Privacy Policy</Text>.
        </Checkbox>
        {errors.acceptTerms && <Text style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errors.acceptTerms}</Text>}
        {errors.apps && <Text style={{ color: C.danger, fontSize: 12, marginTop: 4 }}>{errors.apps}</Text>}

        <Button title="Start now" variant="accent" loading={busy} disabled={domain === "taken"} icon={<Zap size={18} color="#fff" />} style={{ marginTop: 20 }} onPress={submit} />
      </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  chipIcon: { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 13, fontWeight: "600", color: C.ink },
});
