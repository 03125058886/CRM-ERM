import { useState } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { KeyRound, Save, UserRound } from "lucide-react-native";
import { BRAND, COUNTRIES, LANGUAGES, type User } from "@zuvora/shared";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Input, Screen, Select } from "@/components/ui";
import { C, font } from "@/lib/theme";

export default function SettingsScreen() {
  const { user, setUser } = useAuth();
  const u = user!;
  const [profile, setProfile] = useState({ firstName: u.firstName, lastName: u.lastName, company: u.company, phone: u.phone, country: u.country, language: u.language });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwErr, setPwErr] = useState<Partial<typeof pw>>({});
  const [busyA, setBusyA] = useState(false);
  const [busyB, setBusyB] = useState(false);

  async function saveProfile() {
    setBusyA(true);
    try { const r = await api<{ user: User }>("/auth/me", { method: "PATCH", body: profile }); setUser(r.user); Alert.alert("Saved", "Your profile was updated."); }
    catch (e) { Alert.alert("Error", (e as ApiError).message); }
    finally { setBusyA(false); }
  }

  async function changePassword() {
    setPwErr({}); setBusyB(true);
    try { await api("/auth/change-password", { body: pw }); setPw({ currentPassword: "", newPassword: "" }); Alert.alert("Done", "Password changed."); }
    catch (e) { const ae = e as ApiError; if (ae.field) setPwErr({ [ae.field]: ae.message }); else Alert.alert("Error", ae.message); }
    finally { setBusyB(false); }
  }

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={font.h1}>Settings</Text>
        <Text style={[font.muted, { marginTop: 4, marginBottom: 18 }]}>{u.subdomain}{BRAND.domainSuffix} · {u.email}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)}>
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}><UserRound size={18} color={C.primary} /><Text style={font.h3}>Profile</Text></View>
          <Input label="First name" value={profile.firstName} onChangeText={(v) => setProfile({ ...profile, firstName: v })} />
          <Input label="Last name" value={profile.lastName} onChangeText={(v) => setProfile({ ...profile, lastName: v })} />
          <Input label="Company" value={profile.company} onChangeText={(v) => setProfile({ ...profile, company: v })} />
          <Input label="Phone" value={profile.phone} onChangeText={(v) => setProfile({ ...profile, phone: v })} keyboardType="phone-pad" />
          <Select label="Country" value={profile.country} options={COUNTRIES} onChange={(v) => setProfile({ ...profile, country: v })} />
          <Select label="Language" value={profile.language} options={LANGUAGES} onChange={(v) => setProfile({ ...profile, language: v })} />
          <Button title="Save profile" loading={busyA} icon={<Save size={16} color="#fff" />} onPress={saveProfile} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}><KeyRound size={18} color={C.primary} /><Text style={font.h3}>Password</Text></View>
          <Input label="Current password" value={pw.currentPassword} onChangeText={(v) => setPw({ ...pw, currentPassword: v })} secureTextEntry error={pwErr.currentPassword} />
          <Input label="New password" value={pw.newPassword} onChangeText={(v) => setPw({ ...pw, newPassword: v })} secureTextEntry error={pwErr.newPassword} hint="At least 8 characters" />
          <Button title="Change password" variant="ghost" loading={busyB} disabled={!pw.currentPassword || !pw.newPassword} onPress={changePassword} />
        </Card>
      </Animated.View>
    </Screen>
  );
}
