"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { validateLogin, type PendingVerification, type User } from "@zuvora/shared";
import { AuthShell } from "@/components/AuthShell";
import { Input, Spinner } from "@/components/Field";
import { useToast } from "@/components/Toast";
import { api, ApiError, pendingStore } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateLogin({ email, password });
    if (Object.keys(errs).length) return setErrors(errs);
    setBusy(true);
    try {
      const r = await api<({ requiresVerification: true } & PendingVerification) | { user: User }>("/auth/login", { body: { email, password } });
      if ("requiresVerification" in r) {
        pendingStore.set({ ...r, purpose: "verify", email });
        toast("Please verify your phone to continue", "info");
        router.push("/verify");
        return;
      }
      toast(`Welcome back, ${r.user.firstName}!`, "success");
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      const ae = err as ApiError;
      if (ae.field === "email" || ae.field === "password") setErrors({ [ae.field]: ae.message });
      else toast(ae.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Input id="email" type="email" label="Email" autoComplete="email" inputMode="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}); }} error={errors.email} autoFocus />
      <div className="relative">
        <Input id="password" type={showPw ? "text" : "password"} label="Password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErrors({}); }} error={errors.password} />
        <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-[34px] text-mist hover:text-ink" aria-label="Toggle password">
          {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="btn-link">Forgot password?</Link>
      </div>
      <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
        {busy ? <><Spinner /> Signing in…</> : <>Sign in <ArrowRight className="size-4" /></>}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your workspace"
      footer={<>New here? <Link href="/#apps" className="btn-link">Start a free trial</Link></>}
    >
      <Suspense fallback={<div className="h-48 shimmer rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
