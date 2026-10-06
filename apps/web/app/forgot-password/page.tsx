"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound } from "lucide-react";
import { EMAIL_RE, type User } from "@zuvora/shared";
import { AuthShell } from "@/components/AuthShell";
import { Input, Spinner } from "@/components/Field";
import { OtpInput } from "@/components/OtpInput";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";

interface ForgotRes { sent: boolean; pendingId: string | null; maskedEmail: string; devCode?: string }

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<ForgotRes | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function request(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) return setError("Enter a valid email address");
    setBusy(true);
    try {
      const r = await api<ForgotRes>("/auth/forgot", { body: { email } });
      setSent(r);
      toast(`If an account exists, a code was emailed to ${r.maskedEmail}`, "info");
    } catch (err) {
      toast((err as ApiError).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    if (!sent?.pendingId) return toast("No reset session. Check the email you entered.", "error");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setBusy(true);
    try {
      const r = await api<{ user: User }>("/auth/reset", { body: { pendingId: sent.pendingId, code, password } });
      toast(`Password updated. Welcome back, ${r.user.firstName}!`, "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const ae = err as ApiError;
      setError(ae.message);
      toast(ae.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={sent ? <>We emailed a 6-digit code to <span className="font-semibold text-ink">{sent.maskedEmail}</span></> : "Enter your email and we will send you a code."}
      footer={<Link href="/login" className="btn-link">Back to sign in</Link>}
    >
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.form key="req" onSubmit={request} noValidate exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <Input id="email" type="email" label="Email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(undefined); }} error={error} autoFocus />
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? <><Spinner /> Sending…</> : <>Send code <ArrowRight className="size-4" /></>}
            </button>
          </motion.form>
        ) : (
          <motion.form key="reset" onSubmit={reset} noValidate initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <OtpInput value={code} onChange={setCode} error={Boolean(error)} />
            {sent.devCode && (
              <p className="rounded-xl border border-dashed border-amber/60 bg-amber/10 px-3 py-2 text-center text-xs text-ink">
                Dev mode · your code is <button type="button" onClick={() => setCode(sent.devCode!)} className="font-mono font-bold text-primary underline">{sent.devCode}</button>
              </p>
            )}
            <Input id="password" type="password" label="New password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(undefined); }} error={error} hint="At least 8 characters" />
            <button type="submit" disabled={busy || code.length < 6} className="btn-primary w-full !py-3">
              {busy ? <><Spinner /> Updating…</> : <><KeyRound className="size-4" /> Set new password</>}
            </button>
            <button type="button" onClick={() => { setSent(null); setCode(""); setError(undefined); }} className="btn-link mx-auto block">Use a different email</button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
