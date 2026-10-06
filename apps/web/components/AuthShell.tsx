"use client";

import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { Blobs } from "./Blobs";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Blobs />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-lift sm:p-8">
          <h1 className="text-center text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-center text-sm text-slate">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-slate">{footer}</div>}
      </motion.div>
    </main>
  );
}
