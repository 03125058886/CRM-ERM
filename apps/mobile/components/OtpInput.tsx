import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { C, radius } from "@/lib/theme";

/** One hidden input, six rendered boxes: works with SMS autofill on both platforms. */
export function OtpInput({ value, onChange, onComplete, length = 6, error, disabled }: {
  value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; length?: number; error?: boolean; disabled?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    if (error) shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }));
  }, [error, shake]);

  useEffect(() => { const t = setTimeout(() => ref.current?.focus(), 300); return () => clearTimeout(t); }, []);

  return (
    <Pressable onPress={() => ref.current?.focus()}>
      <Animated.View style={[s.row, anim]}>
        {Array.from({ length }).map((_, i) => {
          const ch = value[i] ?? "";
          const active = focused && value.length === i;
          return (
            <View key={i} style={[s.box, ch && { borderColor: C.primary }, active && { borderColor: C.primary, shadowColor: C.primary, shadowOpacity: 0.2, shadowRadius: 8 }, error && { borderColor: C.danger }]}>
              <Text style={s.digit}>{ch}</Text>
              {active && <View style={s.caret} />}
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={ref}
        value={value}
        editable={!disabled}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, "").slice(0, length);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={s.hidden}
        caretHidden
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8 },
  box: { width: 48, height: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  digit: { fontSize: 24, fontWeight: "800", color: C.ink },
  caret: { position: "absolute", width: 2, height: 24, backgroundColor: C.primary, borderRadius: 1 },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
});
