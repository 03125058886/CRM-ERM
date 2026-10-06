"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Eye, EyeOff, Lock, ShieldCheck, Zap } from "lucide-react";
import {
  ALL_APPS, BRAND, COMPANY_SIZES, COUNTRIES, INTERESTS, LANGUAGES, slugify, validateSignup,
  type FieldErrors, type PendingVerification, type SignupPayload,
} from "@nexora/shared";
import { api, ApiError, pendingStore } from "@/lib/api";
import { useToast } from "./Toast";
import { Input, RadioGroup, Select, Spinner } from "./Field";
import { iconFor } from "@/lib/icons";

interface Props {
  apps: string[];
  onBack: () => void;
}

type Form = Omit<SignupPayload, "apps">;

const initial: Form = {
  firstName: "", lastName: "", company: "", subdomain: "", email: "", phone: "", password: "",
  country: "", language: "en", companySize: "", interest: "company", acceptTerms: false,
};

export function SignupForm({ apps, onBack }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<FieldErrors<SignupPayload>>({});
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [domainState, setDomainState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const slugTouched = useRef(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Auto-suggest subdomain from company name until the user edits it manually
  useEffect(() => {
    if (!slugTouched.current) setForm((f) => ({ ...f, subdomain: slugify(f.company) }));
  }, [form.company]);

  // Debounced availability check
  useEffect(() => {
    const name = form.subdomain;
    if (!name) { setDomainState("idle"); return; }
    setDomainState("checking");
    const t = setTimeout(async () => {
      try {
        const r = await api<{ available: boolean; reason?: string }>(`/auth/check-subdomain?name=${encodeURIComponent(name)}`);
        setDomainState(r.available ? "ok" : r.reason === "invalid" ? "invalid" : "taken");
      } catch { setDomainState("idle"); }
    }, 350);
    return () => clearTimeout(t);
  }, [form.subdomain]);

  // Default country from browser locale
  useEffect(() => {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region && COUNTRIES.some((c) => c.id === region)) setForm((f) => ({ ...f, country: f.country || region }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: SignupPayload = { ...form, apps };
    const errs = validateSignup(payload);
    if (Object.keys(errs).length) {
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.getElementById(first)?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      const r = await api<PendingVerification>("/auth/signup", { body: payload });
      pendingStore.set({ ...r, purpose: "verify", email: form.email });
      toast(`We sent a code to ${r.maskedPhone}`, "success");
      router.push("/verify");
    } catch (err) {
      const ae = err as ApiError;
      if (ae.field) setErrors((e) => ({ ...e, [ae.field as keyof SignupPayload]: ae.message }));
      toast(ae.message ?? "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }

  const chosen = apps.map((id) => ALL_APPS.find((a) => a.id === id)).filter(Boolean);

  return (
    <motion.section
      id="signup"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_380px]"
    >
      <form onSubmit={submit} noValidate className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
        <button type="button" onClick={onBack} className="btn-link mb-4"><ArrowLeft className="size-4" /> Change apps</button>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Create your {BRAND.name} account</h2>
        <p className="mt-1 text-sm text-slate">Free instant access. No credit card required.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input id="firstName" label="First name" autoComplete="given-name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} error={errors.firstName} />
          <Input id="lastName" label="Last name" autoComplete="family-name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} error={errors.lastName} />
          <Input id="company" label="Company name" autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} error={errors.company} />
          <div>
            <Input
              id="subdomain" label="Your domain" suffix={BRAND.domainSuffix} autoCapitalize="none" spellCheck={false}
              value={form.subdomain}
              onChange={(e) => { slugTouched.current = true; set("subdomain", slugify(e.target.value)); }}
              error={errors.subdomain ?? (domainState === "taken" ? "Already taken" : domainState === "invalid" ? "3-40 letters, numbers or dashes" : undefined)}
              hint={domainState === "ok" ? "✓ Available" : domainState === "checking" ? "Checking…" : "Where your team will sign in"}
            />
          </div>
          <Input id="email" type="email" label="Email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
          <Input id="phone" type="tel" label="Phone number" autoComplete="tel" inputMode="tel" placeholder="+92 300 1234567" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} hint="We'll text you a verification code" />
          <div className="relative sm:col-span-2">
            <Input id="password" type={showPw ? "text" : "password"} label="Password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} error={errors.password} hint="At least 8 characters" />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-[34px] text-mist hover:text-ink" aria-label={showPw ? "Hide password" : "Show password"}>
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Select id="country" label="Country" options={COUNTRIES} placeholder="Select country" value={form.country} onChange={(e) => set("country", e.target.value)} error={errors.country} />
          <Select id="language" label="Language" options={LANGUAGES} value={form.language} onChange={(e) => set("language", e.target.value)} error={errors.language} />
          <div className="sm:col-span-2">
            <Select id="companySize" label="Company size" options={COMPANY_SIZES} placeholder="Select company size" value={form.companySize} onChange={(e) => set("companySize", e.target.value)} error={errors.companySize} />
          </div>
          <div className="sm:col-span-2">
            <RadioGroup label="Primary interest" name="interest" options={INTERESTS} value={form.interest} onChange={(v) => set("interest", v)} error={errors.interest} />
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate">
          <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${form.acceptTerms ? "border-primary bg-primary text-white" : "border-mist bg-white"}`}>
            {form.acceptTerms && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <input id="acceptTerms" type="checkbox" className="sr-only" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} />
          <span>
            By clicking on <strong className="text-ink">Start now</strong>, you accept our{" "}
            <a href="#" className="text-primary underline">Subscription Agreement</a> and{" "}
            <a href="#" className="text-primary underline">Privacy Policy</a>.
          </span>
        </label>
        {errors.acceptTerms && <p className="mt-1 text-xs text-danger">{errors.acceptTerms}</p>}
        {errors.apps && <p className="mt-2 text-xs text-danger">{errors.apps}</p>}

        <button type="submit" disabled={busy || domainState === "taken"} className="btn-accent mt-6 w-full !py-3 text-base">
          {busy ? <><Spinner /> Creating your workspace…</> : <>Start now <Zap className="size-4" /></>}
        </button>
      </form>

      {/* Summary card */}
      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wider text-mist">Your apps</p>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {chosen.map((a, i) => {
              const Icon = iconFor(a!.icon);
              return (
                <motion.li key={a!.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-2 rounded-xl bg-surface px-2.5 py-2 text-sm font-medium text-ink">
                  <span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: a!.color }}><Icon className="size-3.5" /></span>
                  <span className="truncate">{a!.name}</span>
                </motion.li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate">Your workspace: <span className="font-mono text-ink">{form.subdomain || "yourcompany"}{BRAND.domainSuffix}</span></p>
        </div>
        <ul className="space-y-3 rounded-3xl bg-midnight p-5 text-sm text-white/80">
          <li className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-mint" /> Hosted in secure, ISO-certified data centres.</li>
          <li className="flex gap-3"><Lock className="size-5 shrink-0 text-mint" /> Your data stays yours. Export any time.</li>
          <li className="flex gap-3"><Zap className="size-5 shrink-0 text-mint" /> Database ready in seconds, not hours.</li>
        </ul>
      </aside>
    </motion.section>
  );
}
