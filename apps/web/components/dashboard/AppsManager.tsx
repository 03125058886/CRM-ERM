"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { APP_BY_ID, CATALOG, type User } from "@nexora/shared";
import { iconFor } from "@/lib/icons";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Spinner } from "@/components/Field";

export function AppsManager({ initialUser }: { initialUser: User }) {
  const { toast } = useToast();
  const [user, setUser] = useState(initialUser);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(user.apps);
  const [busy, setBusy] = useState(false);

  const installed = useMemo(() => user.apps.map((id) => APP_BY_ID[id]).filter(Boolean), [user.apps]);
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();

  async function save() {
    setBusy(true);
    try {
      const r = await api<{ user: User }>("/auth/me/apps", { method: "PUT", body: { apps: draft } });
      setUser(r.user);
      setOpen(false);
      toast("Apps updated", "success");
    } catch (err) {
      toast((err as ApiError).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate">{greeting},</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink">{user.firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate">{user.company} · {installed.length} app{installed.length === 1 ? "" : "s"} installed</p>
        </div>
        <button onClick={() => { setDraft(user.apps); setOpen(true); }} className="btn-primary"><Plus className="size-4" /> Add apps</button>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {installed.map((app, i) => {
          const Icon = iconFor(app.icon);
          return (
            <motion.a
              key={app.id}
              href="#"
              onClick={(e) => { e.preventDefault(); toast(`${app.name} is coming soon in this demo`, "info"); }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex flex-col items-center rounded-3xl border border-line bg-white p-5 text-center shadow-soft transition-shadow hover:shadow-lift"
            >
              <span className="flex size-16 items-center justify-center rounded-2xl text-white shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}bb)` }}>
                <Icon className="size-8" strokeWidth={2} />
              </span>
              <span className="mt-3 text-sm font-semibold text-ink">{app.name}</span>
              <span className="mt-0.5 line-clamp-1 text-xs text-slate">{app.blurb}</span>
              <ArrowUpRight className="absolute right-3 top-3 size-4 text-mist opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.a>
          );
        })}
        {installed.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-line p-12 text-center text-slate">No apps yet. Click “Add apps” to get started.</div>
        )}
      </div>

      {/* Add apps modal */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-t-3xl bg-white shadow-lift sm:rounded-3xl"
              role="dialog" aria-modal="true" aria-label="Manage apps"
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">Manage apps</h2>
                  <p className="text-xs text-slate">{draft.length} selected</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-mist hover:bg-surface hover:text-ink" aria-label="Close"><X className="size-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {CATALOG.map((cat) => (
                  <div key={cat.id} className="mb-5">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mist">{cat.name}</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {cat.apps.map((app) => {
                        const Icon = iconFor(app.icon);
                        const on = draft.includes(app.id);
                        return (
                          <button
                            key={app.id} type="button"
                            onClick={() => setDraft((d) => (on ? d.filter((x) => x !== app.id) : [...d, app.id]))}
                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${on ? "border-primary bg-primary-soft/60" : "border-line hover:border-primary-light"}`}
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: app.color }}><Icon className="size-4" /></span>
                            <span className="flex-1 truncate font-medium text-ink">{app.name}</span>
                            {on && <Check className="size-4 text-primary" strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
                <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
                <button onClick={save} disabled={busy} className="btn-primary">{busy ? <><Spinner /> Saving…</> : "Save changes"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
