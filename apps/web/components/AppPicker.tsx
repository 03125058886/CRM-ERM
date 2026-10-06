"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LayoutGrid, Search, X } from "lucide-react";
import { ALL_APPS, CATALOG } from "@nexora/shared";
import { selectionStore } from "@/lib/api";
import { AppTile } from "./AppTile";
import { Reveal } from "./Reveal";

interface Props {
  onContinue: (apps: string[]) => void;
}

export function AppPicker({ onContinue }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelected(selectionStore.get());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) selectionStore.set(selected);
  }, [selected, hydrated]);

  const toggle = useCallback((id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }, []);

  const q = query.trim().toLowerCase();
  const categories = useMemo(
    () =>
      CATALOG.map((c) => ({ ...c, apps: q ? c.apps.filter((a) => a.name.toLowerCase().includes(q) || a.blurb.toLowerCase().includes(q)) : c.apps }))
        .filter((c) => c.apps.length > 0),
    [q],
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <section id="apps" className="scroll-mt-20">
      {/* Search + quick actions */}
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 46 apps…"
            className="field !pl-10"
            aria-label="Search apps"
          />
        </label>
        {selected.length > 0 && (
          <button type="button" onClick={() => setSelected([])} className="btn-ghost !px-3.5" aria-label="Clear selection">
            <X className="size-4" /> Clear
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mt-10 space-y-12">
        {categories.map((cat, ci) => (
          <Reveal key={cat.id} delay={Math.min(ci, 4) * 0.05}>
            <div className="mb-4 flex items-baseline gap-3">
              <h3 className="text-lg font-bold text-ink">{cat.name}</h3>
              <span className="text-xs font-medium text-mist">{cat.apps.length} app{cat.apps.length > 1 ? "s" : ""}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cat.apps.map((app, i) => (
                <AppTile key={app.id} app={app} index={i} selected={selectedSet.has(app.id)} onToggle={toggle} />
              ))}
            </div>
          </Reveal>
        ))}
        {categories.length === 0 && (
          <p className="py-16 text-center text-slate">No apps match “{query}”.</p>
        )}
      </div>

      {/* Sticky selection bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6"
          >
            <div className="glass mx-auto flex max-w-3xl items-center gap-3 rounded-2xl p-3 shadow-lift">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <LayoutGrid className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  <motion.span key={selected.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="inline-block tabular-nums">{selected.length}</motion.span> app{selected.length > 1 ? "s" : ""} selected
                </p>
                <p className="hidden truncate text-xs text-slate sm:block">
                  {selected.map((id) => ALL_APPS.find((a) => a.id === id)?.name).filter(Boolean).join(", ")}
                </p>
              </div>
              <button type="button" onClick={() => onContinue(selected)} className="btn-accent shrink-0">
                Continue <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
