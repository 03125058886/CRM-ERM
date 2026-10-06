import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { ArrowRight, Search } from "lucide-react-native";
import { CATALOG } from "@zuvora/shared";
import { AppTile } from "@/components/AppTile";
import { Button, Screen } from "@/components/ui";
import { selectionStore } from "@/lib/auth";
import { C, font, radius, shadow } from "@/lib/theme";

export default function ChooseApps() {
  const [selected, setSelected] = useState<string[]>(selectionStore.get());
  const [q, setQ] = useState("");
  const toggle = useCallback((id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])), []);
  const set = useMemo(() => new Set(selected), [selected]);
  const cats = useMemo(() => {
    const k = q.trim().toLowerCase();
    return CATALOG.map((c) => ({ ...c, apps: k ? c.apps.filter((a) => a.name.toLowerCase().includes(k)) : c.apps })).filter((c) => c.apps.length);
  }, [q]);

  return (
    <View style={{ flex: 1 }}>
      <Screen contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={font.h1}>Choose your <Text style={{ color: C.primary }}>apps</Text></Text>
          <Text style={[font.muted, { marginTop: 6 }]}>Free instant access. No credit card required.</Text>
          <View style={s.search}>
            <Search size={18} color={C.mist} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search 46 apps…" placeholderTextColor={C.mist} style={s.searchInput} />
          </View>
        </Animated.View>

        {cats.map((cat) => (
          <View key={cat.id} style={{ marginTop: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <Text style={font.h3}>{cat.name}</Text>
              <Text style={font.tiny}>{cat.apps.length}</Text>
            </View>
            <View style={{ gap: 10 }}>
              {cat.apps.map((app, i) => <AppTile key={app.id} app={app} index={i} selected={set.has(app.id)} onToggle={toggle} />)}
            </View>
          </View>
        ))}
        {cats.length === 0 && <Text style={[font.muted, { textAlign: "center", marginTop: 40 }]}>No apps match “{q}”.</Text>}
      </Screen>

      {selected.length > 0 && (
        <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown} style={s.bar}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", color: C.ink }}>{selected.length} app{selected.length > 1 ? "s" : ""} selected</Text>
            <Text style={font.muted} numberOfLines={1}>Tap continue to create your workspace</Text>
          </View>
          <Button
            title="Continue"
            variant="accent"
            icon={<ArrowRight size={18} color="#fff" />}
            style={{ paddingVertical: 12 }}
            onPress={() => { selectionStore.set(selected); router.push("/(auth)/signup"); }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: radius.md, paddingHorizontal: 12, marginTop: 16, height: 46 },
  searchInput: { flex: 1, fontSize: 15, color: C.ink },
  bar: { position: "absolute", left: 16, right: 16, bottom: 20, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: C.line, ...shadow.lift },
});
