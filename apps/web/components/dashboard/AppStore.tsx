"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Download, Search, Trash2 } from "lucide-react";
import { CATALOG, type User } from "@nexora/shared";
import { iconFor } from "@/lib/icons";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Spinner } from "@/components/Field";

/** Odoo-style "Apps" store: install / uninstall any of the 46 apps. */
export function AppStore({ initialUser }: { initialUser: User }) {
  const { toast } = useToast();
  const params = useSearchParams();
  const highlight = params.get("highlight");
  const [user, setUser] = useState(initialUser);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "installed">("all");

  useEffect(() => {
    if (highlight) document.getElementById(`app-${highlight}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlight]);

  const cats = useMemo(() => {
    const k = q.trim().toLowerCase();
    return CATALOG.map((c) => ({ ...c, apps: c.apps.filter((a) => (!k || a.name.toLowerCase().includes(k) || a.blurb.toLowerCase().includes(k)) && (filter === "all" || user.apps.includes(a.id))) })).filter((c) => c.apps.length);
  }, [q, filter, user.apps]);

  async function toggle(id: string) {
    const installed = user.apps.includes(id);
    const next = installed ? user.apps.filter((x) => x !== id) : [...user.apps, id];
    setBusy(id);
    try {
      const r = await api<{ user: User }>("/auth/me/apps", { method: "PUT", body: { apps: next } });
      setUser(r.user);
      toast(installed ? "App uninstalled" : "App installed", "success");
    } catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(null); }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Apps</h1>
          <p className="text-sm text-slate">{user.apps.length} of {CATALOG.reduce((s, c) => s + c.apps.length, 0)} apps installed</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
            {(["all", "installed"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 font-medium capitalize ${filter === f ? "bg-primary text-white" : "text-slate hover:text-ink"}`}>{f}</button>
            ))}
          </div>
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search apps…" className="field !w-48 !pl-9 sm:!w-64" />
          </label>
        </div>
      </motion.div>

      <div className="mt-8 space-y-10">
        {cats.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-mist">{cat.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cat.apps.map((app) => {
                const Icon = iconFor(app.icon);
                const installed = user.apps.includes(app.id);
                const hl = highlight === app.id;
                return (
                  <div id={`app-${app.id}`} key={app.id} className={`flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-soft transition-shadow ${hl ? "border-accent shadow-glow" : "border-line"}`}>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}cc)` }}><Icon className="size-6" /></span>
                    <div className="min-w-0 flex-1">
                      {installed ? <Link href={`/dashboard/${app.id}`} className="block truncate text-[15px] font-semibold text-ink hover:text-primary">{app.name}</Link> : <p className="truncate text-[15px] font-semibold text-ink">{app.name}</p>}
                      <p className="truncate text-xs text-slate">{app.blurb}</p>
                    </div>
                    <button onClick={() => toggle(app.id)} disabled={busy === app.id} className={installed ? "btn-ghost !px-3 !py-2 text-xs" : "btn-primary !px-3 !py-2 text-xs"} aria-label={installed ? `Uninstall ${app.name}` : `Install ${app.name}`}>
                      {busy === app.id ? <Spinner /> : installed ? <><Check className="size-3.5" /> Installed</> : <><Download className="size-3.5" /> Install</>}
                    </button>
                    {installed && busy !== app.id && (
                      <button onClick={() => toggle(app.id)} className="rounded-lg p-2 text-mist hover:bg-danger/10 hover:text-danger" aria-label={`Uninstall ${app.name}`} title="Uninstall"><Trash2 className="size-4" /></button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {cats.length === 0 && <p className="py-16 text-center text-slate">No apps match.</p>}
      </div>
    </>
  );
}
