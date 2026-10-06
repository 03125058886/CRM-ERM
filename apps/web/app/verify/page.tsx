"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, MessageSquareText, Phone, ShieldCheck } from "lucide-react";
import type { PendingVerification, User } from "@zuvora/shared";
import { AuthShell } from "@/components/AuthShell";
import { OtpInput } from "@/components/OtpInput";
import { Spinner } from "@/components/Field";
import { useToast } from "@/components/Toast";
import { api, ApiError, pendingStore, selectionStore, type Pending } from "@/lib/api";

const CHANNELS = [
  { id: "sms", label: "SMS", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquareText },
  { id: "email", label: "Email", icon: Mail },
] as const;

export default function VerifyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<Pending | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const p = pendingStore.get();
    setPending(p && p.purpose === "verify" ? p : null);
    setCooldown(30);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(value: string) {
    if (!pending || busy) return;
    setBusy(true);
    setError(false);
    try {
      const r = await api<{ user: User }>("/auth/verify", { body: { pendingId: pending.pendingId, code: value } });
      pendingStore.clear();
      selectionStore.clear();
      toast(`Verified! Welcome to Zuvora, ${r.user.firstName} 🎉`, "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const ae = err as ApiError;
      setError(true);
      setCode("");
      toast(ae.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function resend(channel: (typeof CHANNELS)[number]["id"]) {
    if (!pending || cooldown > 0) return;
    try {
      const r = await api<PendingVerification>("/auth/resend", { body: { pendingId: pending.pendingId, channel } });
      const next = { ...pending, ...r };
      pendingStore.set(next);
      setPending(next);
      setCooldown(30);
      setCode("");
      toast(`New code sent via ${channel === "sms" ? "SMS" : channel === "whatsapp" ? "WhatsApp" : "email"} to ${r.maskedPhone}`, "success");
    } catch (err) {
      toast((err as ApiError).message, "error");
    }
  }

  if (pending === undefined) return null;

  if (!pending) {
    return (
      <AuthShell title="Nothing to verify" subtitle="Your verification session has expired or was already completed.">
        <div className="flex flex-col gap-3">
          <Link href="/login" className="btn-primary">Sign in</Link>
          <Link href="/#apps" className="btn-ghost">Start a free trial</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your phone"
      subtitle={<>Enter the 6-digit code we sent to <span className="font-semibold text-ink">{pending.maskedPhone}</span></>}
      footer={<>Wrong number? <Link href="/#apps" className="btn-link">Start over</Link></>}
    >
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <ShieldCheck className="size-7" />
      </motion.div>

      <OtpInput value={code} onChange={(v) => { setCode(v); setError(false); }} onComplete={verify} error={error} disabled={busy} />

      {pending.devCode && (
        <p className="mt-4 rounded-xl border border-dashed border-amber/60 bg-amber/10 px-3 py-2 text-center text-xs text-ink">
          Dev mode · your code is <button type="button" onClick={() => { setCode(pending.devCode!); verify(pending.devCode!); }} className="font-mono font-bold text-primary underline">{pending.devCode}</button>
        </p>
      )}

      <button type="button" onClick={() => verify(code)} disabled={busy || code.length < 6} className="btn-primary mt-6 w-full !py-3">
        {busy ? <><Spinner /> Verifying…</> : "Verify & continue"}
      </button>

      <div className="mt-6 border-t border-line pt-5 text-center">
        <p className="text-xs text-slate">
          {cooldown > 0 ? <>Didn&apos;t get it? Resend in <span className="font-semibold tabular-nums text-ink">{cooldown}s</span></> : "Didn't get it? Resend via"}
        </p>
        <div className="mt-3 flex justify-center gap-2">
          {CHANNELS.map((c) => (
            <button key={c.id} type="button" onClick={() => resend(c.id)} disabled={cooldown > 0} className="btn-ghost !px-3 !py-2 text-sm disabled:opacity-40">
              <c.icon className="size-4" /> {c.label}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
