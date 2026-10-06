import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import type { AppDef } from "@zuvora/shared";
import { iconFor } from "@/lib/icons";
import { C, radius, shadow } from "@/lib/theme";

export const AppTile = memo(function AppTile({ app, selected, onToggle, index = 0, compact }: {
  app: AppDef; selected: boolean; onToggle: (id: string) => void; index?: number; compact?: boolean;
}) {
  const Icon = iconFor(app.icon);
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const badge = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(selected ? 1 : 0, { damping: 14 }) }], opacity: withSpring(selected ? 1 : 0) }));

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify().damping(18)} style={[{ width: compact ? "48%" : "100%" }, anim]}>
      <Pressable
        onPress={() => { Haptics.selectionAsync().catch(() => {}); onToggle(app.id); }}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[s.tile, selected && s.tileOn]}
      >
        <View style={[s.icon, { backgroundColor: app.color }]}><Icon size={22} color="#fff" strokeWidth={2.2} /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={s.name}>{app.name}</Text>
          {!compact && <Text numberOfLines={1} style={s.blurb}>{app.blurb}</Text>}
        </View>
        <Animated.View style={[s.badge, badge]}><Check size={13} color="#fff" strokeWidth={3} /></Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  tile: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderRadius: radius.lg, borderWidth: 1.5, borderColor: C.line, padding: 12, ...shadow.soft },
  tileOn: { borderColor: C.primary, backgroundColor: "#F3F1FF" },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700", color: C.ink },
  blurb: { fontSize: 12, color: C.slate, marginTop: 1 },
  badge: { position: "absolute", top: -7, right: -7, width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", ...shadow.soft },
});
