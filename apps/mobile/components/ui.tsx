import { forwardRef, useState } from "react";
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type TextInputProps, type ViewStyle,
  KeyboardAvoidingView, Platform, ScrollView, type ScrollViewProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, Check } from "lucide-react-native";
import type { Option } from "@zuvora/shared";
import { C, radius, shadow, font } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ---------- Button ---------- */
export function Button({ title, variant = "primary", loading, icon, style, disabled, ...rest }: PressableProps & {
  title: string; variant?: "primary" | "accent" | "ghost" | "link"; loading?: boolean; icon?: React.ReactNode; style?: ViewStyle;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = variant === "primary" ? C.primary : variant === "accent" ? C.accent : variant === "ghost" ? C.white : "transparent";
  const fg = variant === "ghost" ? C.ink : variant === "link" ? C.primary : C.white;
  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[
        s.btn, { backgroundColor: bg }, variant === "ghost" && { borderWidth: 1, borderColor: C.line },
        variant === "link" && { paddingVertical: 6 }, variant !== "ghost" && variant !== "link" && shadow.soft,
        (disabled || loading) && { opacity: 0.6 }, anim, style,
      ]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon}
          <Text style={[s.btnText, { color: fg }, variant === "link" && { fontSize: 14 }]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

/* ---------- Input ---------- */
export const Input = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string; suffix?: string; right?: React.ReactNode }>(
  function Input({ label, error, hint, suffix, right, style, ...rest }, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={s.label}>{label}</Text>
        <View style={[s.inputWrap, focused && { borderColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, error ? { borderColor: C.danger } : null]}>
          <TextInput
            ref={ref}
            placeholderTextColor={C.mist}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[s.input, style]}
            {...rest}
          />
          {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
          {right}
        </View>
        {error ? <Text style={s.error}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
    );
  },
);

/* ---------- Select (bottom sheet style picker) ---------- */
export function Select({ label, value, options, onChange, placeholder = "Select…", error }: {
  label: string; value: string; options: Option[]; onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const current = options.find((o) => o.id === value);
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable onPress={() => setOpen((v) => !v)} style={[s.inputWrap, error ? { borderColor: C.danger } : null]}>
        <Text style={[s.input, !current && { color: C.mist }]}>{current?.label ?? placeholder}</Text>
        <ChevronDown size={18} color={C.mist} />
      </Pressable>
      {error ? <Text style={s.error}>{error}</Text> : null}
      {open && (
        <View style={s.dropdown}>
          {options.length > 12 && (
            <TextInput value={q} onChangeText={setQ} placeholder="Search…" placeholderTextColor={C.mist} style={[s.input, { borderBottomWidth: 1, borderColor: C.line, paddingHorizontal: 12 }]} autoFocus />
          )}
          <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {filtered.map((o) => (
              <Pressable key={o.id} onPress={() => { onChange(o.id); setOpen(false); setQ(""); }} style={[s.option, o.id === value && { backgroundColor: C.primarySoft }]}>
                <Text style={[font.body, o.id === value && { color: C.primary, fontWeight: "600" }]}>{o.label}</Text>
                {o.id === value && <Check size={16} color={C.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ---------- Radio ---------- */
export function Radio({ label, options, value, onChange }: { label: string; options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <View style={{ gap: 8 }}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable key={o.id} onPress={() => onChange(o.id)} style={[s.radio, on && { borderColor: C.primary, backgroundColor: C.primarySoft }]}>
              <View style={[s.radioDot, on && { borderColor: C.primary }]}>{on && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary }} />}</View>
              <Text style={[font.body, { flex: 1, color: on ? C.ink : C.slate }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Checkbox ---------- */
export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={() => onChange(!checked)} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <View style={[s.checkbox, checked && { backgroundColor: C.primary, borderColor: C.primary }]}>{checked && <Check size={14} color="#fff" strokeWidth={3} />}</View>
      <Text style={[font.muted, { flex: 1, lineHeight: 19 }]}>{children}</Text>
    </Pressable>
  );
}

/* ---------- Card ---------- */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/* ---------- Screen (safe area + keyboard aware scroll) ---------- */
export function Screen({ children, scroll = true, contentContainerStyle, ...rest }: ScrollViewProps & { children: React.ReactNode; scroll?: boolean }) {
  const body = scroll ? (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ padding: 20, paddingBottom: 48 }, contentContainerStyle]} showsVerticalScrollIndicator={false} {...rest}>
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1, padding: 20 }, contentContainerStyle]}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>{body}</KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Gradient hero ---------- */
export function Hero({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={[C.primary, C.primaryLight, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, style]}>
      {children}
    </LinearGradient>
  );
}

/* ---------- Logo ---------- */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <LinearGradient colors={[C.primary, C.primaryLight, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: size * 0.5, marginTop: -2 }}>N</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: radius.md },
  btnText: { fontSize: 16, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", color: C.slate, marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, paddingHorizontal: 14, minHeight: 50 },
  input: { flex: 1, fontSize: 15, color: C.ink, paddingVertical: 12 },
  suffix: { color: C.mist, fontSize: 13, fontWeight: "600" },
  error: { color: C.danger, fontSize: 12, marginTop: 4 },
  hint: { color: C.mist, fontSize: 12, marginTop: 4 },
  dropdown: { marginTop: 6, backgroundColor: C.white, borderRadius: radius.md, borderWidth: 1, borderColor: C.line, overflow: "hidden", ...shadow.soft },
  option: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  radio: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.mist, alignItems: "center", justifyContent: "center" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.mist, backgroundColor: C.white, alignItems: "center", justifyContent: "center", marginTop: 1 },
  card: { backgroundColor: C.white, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: C.line, ...shadow.soft },
  hero: { borderRadius: radius.xl, padding: 24, overflow: "hidden" },
});
