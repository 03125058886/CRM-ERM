"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Save, UserRound } from "lucide-react";
import { BRAND, COUNTRIES, LANGUAGES, type User } from "@zuvora/shared";
import { Input, Select, Spinner } from "@/components/Field";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";

export function SettingsForms({ initialUser }: { initialUser: User }) {
  const { toast } = useToast();
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState({ firstName: user.firstName, lastName: user.lastName, company: user.company, phone: user.phone, country: user.country, language: user.language });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [pwErr, setPwErr] = useState<Partial<typeof pw>>({});
  const [busyA, setBusyA] = useState(false);
  const [busyB, setBusyB] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusyA(true);
    try {
      const r = await api<{ user: User }>("/auth/me", { method: "PATCH", body: profile });
      setUser(r.user);
      toast("Profile saved", "success");
    } catch (err) { toast((err as ApiError).message, "error"); } finally { setBusyA(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr({});
    setBusyB(true);
    try {
      await api("/auth/change-password", { body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      toast("Password changed", "success");
    } catch (err) {
      const ae = err as ApiError;
      if (ae.field) setPwErr({ [ae.field]: ae.message });
      else toast(ae.message, "error");
    } finally { setBusyB(false); }
  }

  const card = "rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-slate">Workspace <span className="font-mono text-ink">{user.subdomain}{BRAND.domainSuffix}</span> · {user.email}</p>
      </motion.div>

      <motion.form onSubmit={saveProfile} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={card}>
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><UserRound className="size-5 text-primary" /> Profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input id="firstName" label="First name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
          <Input id="lastName" label="Last name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
          <Input id="company" label="Company" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
          <Input id="phone" label="Phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <Select id="country" label="Country" options={COUNTRIES} value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
          <Select id="language" label="Language" options={LANGUAGES} value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })} />
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={busyA} className="btn-primary">{busyA ? <><Spinner /> Saving…</> : <><Save className="size-4" /> Save profile</>}</button>
        </div>
      </motion.form>

      <motion.form onSubmit={changePassword} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><KeyRound className="size-5 text-primary" /> Password</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input id="currentPassword" type="password" label="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErr.currentPassword} />
          <Input id="newPassword" type="password" label="New password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErr.newPassword} hint="At least 8 characters" />
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={busyB || !pw.currentPassword || !pw.newPassword} className="btn-ghost">{busyB ? <><Spinner /> Updating…</> : "Change password"}</button>
        </div>
      </motion.form>
    </div>
  );
}
