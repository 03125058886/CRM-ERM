"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { menusFor, type AppDef, type WorkspaceView } from "@nexora/shared";
import { iconFor } from "@/lib/icons";

/** Odoo-style secondary menu bar: app name + dropdown menus (Sales / Leads / Reporting / Configuration…). */
export function AppMenuBar({ app, view }: { app: AppDef; view?: WorkspaceView }) {
  const menus = menusFor(app.id);
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = iconFor(app.icon);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="-mx-4 -mt-8 mb-6 border-b border-line bg-white/80 px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-1 overflow-x-auto">
        <Link href={`/dashboard/${app.id}`} className="mr-3 flex shrink-0 items-center gap-2 text-[15px] font-bold text-ink">
          <span className="flex size-7 items-center justify-center rounded-lg text-white" style={{ background: app.color }}><Icon className="size-4" /></span>
          {app.name}
        </Link>
        {menus.map((m) => {
          const active = m.items.some((i) => i.view && i.view === view);
          return (
            <div key={m.id} className="relative shrink-0">
              <button onClick={() => setOpen(open === m.id ? null : m.id)} onMouseEnter={() => open && setOpen(m.id)} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${active || open === m.id ? "bg-primary-soft text-primary" : "text-slate hover:bg-surface hover:text-ink"}`} aria-haspopup="menu" aria-expanded={open === m.id}>
                {m.label} <ChevronDown className="size-3.5 opacity-60" />
              </button>
              <AnimatePresence>
                {open === m.id && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }} className="absolute left-0 top-full z-30 mt-1 min-w-48 rounded-xl border border-line bg-white p-1.5 shadow-lift" role="menu">
                    {m.items.map((it) => {
                      const href = it.href ?? (it.newRecord ? `/dashboard/${app.id}/new` : `/dashboard/${app.id}?view=${it.view}`);
                      const isActive = it.view && it.view === view;
                      return (
                        <Link key={it.id} href={href} onClick={() => setOpen(null)} role="menuitem" className={`block rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-primary text-white" : "text-ink hover:bg-primary-soft"}`}>
                          {it.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
