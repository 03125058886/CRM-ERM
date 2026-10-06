"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BRAND } from "@zuvora/shared";
import { CreditCard, Gauge, Headset, MessageCircle, PlayCircle, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Blobs } from "@/components/Blobs";
import { AppPicker } from "@/components/AppPicker";
import { SignupForm } from "@/components/SignupForm";
import { Reveal } from "@/components/Reveal";

const PERKS = [
  { icon: CreditCard, title: "No credit card", text: "Start free. Upgrade only when you are ready." },
  { icon: Gauge, title: "Ready in seconds", text: "Your database is provisioned instantly." },
  { icon: Sparkles, title: "46 apps, one login", text: "Everything talks to everything. No integrations to buy." },
];

export default function TrialPage() {
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [apps, setApps] = useState<string[]>([]);

  const goForm = useCallback((selected: string[]) => {
    setApps(selected);
    setStep("form");
  }, []);
  const goPick = useCallback(() => setStep("pick"), []);

  useEffect(() => {
    if (step === "form") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <>
      <Navbar />
      <main className="relative">
        <Blobs />

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-20">
          <motion.span
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-soft"
          >
            <Sparkles className="size-3.5" /> Free 15-day trial · no credit card
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-6xl"
          >
            {step === "pick" ? <>Choose your <span className="text-gradient">apps</span></> : <>Almost <span className="text-gradient">there</span></>}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6 }}
            className="mx-auto mt-4 max-w-xl text-lg text-slate"
          >
            {step === "pick"
              ? "Free instant access. No credit card required. Pick the apps you need today, add more whenever you like."
              : `Tell us a little about you and we will spin up your ${BRAND.name} workspace.`}
          </motion.p>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {step === "pick" ? (
              <motion.div key="pick" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <AppPicker onContinue={goForm} />
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <SignupForm apps={apps} onBack={goPick} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Perks */}
        <section id="how" className="mx-auto mt-28 max-w-7xl scroll-mt-24 px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Why teams pick {BRAND.name}</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate">All your business software, finally in one place, built to be fast on every screen.</p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PERKS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <div className="group h-full rounded-3xl border border-line bg-white p-6 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <p.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Support */}
        <section id="support" className="mx-auto mt-24 max-w-7xl scroll-mt-24 px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-midnight p-8 text-white sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/40 blur-3xl animate-float" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-accent/30 blur-3xl animate-float-slow" />
              <div className="relative grid items-center gap-8 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-mint">{BRAND.name} Experience</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Real humans, real fast.</h2>
                  <ol className="mt-6 space-y-4 text-white/80">
                    <li className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">1</span> Use the live chat to ask your questions.</li>
                    <li className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold">2</span> An operator answers within a few minutes.</li>
                  </ol>
                  <a href="#" className="btn mt-8 bg-white text-midnight hover:bg-white/90"><PlayCircle className="size-5" /> Watch now</a>
                </div>
                <div className="relative mx-auto w-full max-w-sm">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-white p-4 text-ink shadow-lift"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary"><Headset className="size-5" /></span>
                      <div><p className="text-sm font-semibold">Support · Sara</p><p className="text-xs text-mint">● Online now</p></div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="w-fit rounded-2xl rounded-bl-sm bg-surface px-3 py-2">Hi! Need a hand setting up Inventory?</p>
                      <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-white">Yes, how do I add a warehouse?</p>
                      <motion.p
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9 }}
                        className="w-fit rounded-2xl rounded-bl-sm bg-surface px-3 py-2"
                      >Inventory → Configuration → Warehouses → New. Takes 10 seconds 🚀</motion.p>
                    </div>
                  </motion.div>
                  <motion.span
                    animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute -bottom-4 -right-4 flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-lift"
                  ><MessageCircle className="size-6" /></motion.span>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
