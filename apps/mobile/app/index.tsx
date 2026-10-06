import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ArrowRight, CreditCard, Gauge, Sparkles } from "lucide-react-native";
import { BRAND } from "@nexora/shared";
import { useAuth } from "@/lib/auth";
import { Button, Hero, LogoMark, Screen } from "@/components/ui";
import { C, font } from "@/lib/theme";

const PERKS = [
  { icon: CreditCard, text: "No credit card required" },
  { icon: Gauge, text: "Workspace ready in seconds" },
  { icon: Sparkles, text: "46 apps, one login" },
];

export default function Welcome() {
  const { user, ready } = useAuth();
  if (!ready) return <View style={s.center}><ActivityIndicator color={C.primary} /></View>;
  if (user) return <Redirect href="/(app)/dashboard" />;

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: "center", marginBottom: 24 }}>
        <LogoMark size={64} />
        <Text style={[font.h1, { marginTop: 14 }]}>{BRAND.name}</Text>
        <Text style={[font.muted, { textAlign: "center", marginTop: 6 }]}>{BRAND.tagline}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).duration(500)}>
        <Hero>
          <Text style={s.heroKicker}>FREE 15-DAY TRIAL</Text>
          <Text style={s.heroTitle}>Choose your apps.{"\n"}Start instantly.</Text>
          <View style={{ gap: 10, marginTop: 16 }}>
            {PERKS.map((p) => (
              <View key={p.text} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={s.perkIcon}><p.icon size={16} color="#fff" /></View>
                <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 15 }}>{p.text}</Text>
              </View>
            ))}
          </View>
          <Button
            title="Try it free"
            variant="ghost"
            icon={<ArrowRight size={18} color={C.ink} />}
            style={{ marginTop: 22, backgroundColor: "#fff" }}
            onPress={() => router.push("/(auth)/choose-apps")}
          />
        </Hero>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={font.muted}>Already have a workspace?</Text>
        <Button title="Sign in" variant="link" onPress={() => router.push("/(auth)/login")} />
      </Animated.View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  heroKicker: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginTop: 8, lineHeight: 34 },
  perkIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
});
