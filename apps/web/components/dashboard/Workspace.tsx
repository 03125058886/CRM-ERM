"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Columns3, List, Plus, Search, Trash2, X } from "lucide-react";
import { moduleFor, type AppDef, type ModuleDef, type RecordRow } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { iconFor } from "@/lib/icons";
import { useToast } from "@/components/Toast";
import { Input, Select, Spinner } from "@/components/Field";

type Draft = { title: string; stage: string; amount: string; partner: string; notes: string };
const emptyDraft = (stage: string): Draft => ({ title: "", stage, amount: "", partner: "", notes: "" });
const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

const STAGE_COLORS = ["#5B4BFF", "#8A7DFF", "#FFB020", "#22D3A5", "#E5484D", "#9AA3C2"];
const stageColor = (mod: ModuleDef, stage: string) => {
  const i = mod.stages.indexOf(stage);
  const last = mod.stages.length - 1;
  if (/lost|cancel|refus|fail|scrap|archiv|no-show/i.test(stage)) return "#E5484D";
  if (i === last || /won|done|paid|solved|published|hired|repaired|signed|live|reconciled|reimbursed/i.test(stage)) return "#22D3A5";
  return STAGE_COLORS[i % 3];
};

export function Workspace({ app }: { app: AppDef }) {
  const { toast } = useToast();
  const mod = useMemo(() => moduleFor(app.id), [app.id]);
  const Icon = iconFor(app.icon);
  const [records, setRecords] = useState<RecordRow[] | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<RecordRow | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(mod.stages[0]));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Partial<Draft>>({});

  useEffect(() => {
    let alive = true;
    api<{ records: RecordRow[] }>(`/apps/${app.id}/records`)
      .then((r) => { if (alive) setRecords(r.records); })
      .catch((e: ApiError) => { toast(e.message, "error"); if (alive) setRecords([]); });
    return () => { alive = false; };
  }, [app.id, toast]);

  useEffect(() => {
    try { const v = localStorage.getItem("nexora.view"); if (v === "list" || v === "kanban") setView(v); } catch {}
  }, []);
  const switchView = (v: "kanban" | "list") => { setView(v); try { localStorage.setItem("nexora.view", v); } catch {} };

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (records ?? []).filter((r) => !k || r.title.toLowerCase().includes(k) || r.partner.toLowerCase().includes(k) || r.notes.toLowerCase().includes(k));
  }, [records, q]);

  const total = useMemo(() => filtered.reduce((s, r) => s + (r.amount ?? 0), 0), [filtered]);
  const lastStage = mod.stages[mod.stages.length - 1];
  const doneCount = filtered.filter((r) => r.stage === lastStage).length;

  function openNew(stage = mod.stages[0]) { setDraft(emptyDraft(stage)); setErr({}); setEditing("new"); }
  function openEdit(r: RecordRow) { setDraft({ title: r.title, stage: r.stage, amount: r.amount == null ? "" : String(r.amount), partner: r.partner, notes: r.notes }); setErr({}); setEditing(r); }

  async function save() {
    if (!draft.title.trim()) return setErr({ title: `${mod.noun} name is required` });
    setBusy(true);
    try {
      const body = { ...draft, amount: draft.amount === "" ? null : Number(draft.amount) };
      if (editing === "new") {
        const r = await api<{ record: RecordRow }>(`/apps/${app.id}/records`, { body });
        setRecords((l) => [r.record, ...(l ?? [])]);
        toast(`${mod.noun} created`, "success");
      } else if (editing) {
        const r = await api<{ record: RecordRow }>(`/records/${editing.id}`, { method: "PATCH", body });
        setRecords((l) => (l ?? []).map((x) => (x.id === r.record.id ? r.record : x)));
        toast("Saved", "success");
      }
      setEditing(null);
    } catch (e) {
      const ae = e as ApiError;
      if (ae.field) setErr({ [ae.field]: ae.message }); else toast(ae.message, "error");
    } finally { setBusy(false); }
  }

  async function move(r: RecordRow, dir: 1 | -1) {
    const i = mod.stages.indexOf(r.stage);
    const next = mod.stages[i + dir];
    if (!next) return;
    setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? { ...x, stage: next } : x)));
    try {
      const res = await api<{ record: RecordRow }>(`/records/${r.id}`, { method: "PATCH", body: { stage: next } });
      setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? res.record : x)));
    } catch (e) {
      setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? r : x)));
      toast((e as ApiError).message, "error");
    }
  }

  async function remove(r: RecordRow) {
    setBusy(true);
    try {
      await api(`/records/${r.id}`, { method: "DELETE" });
      setRecords((l) => (l ?? []).filter((x) => x.id !== r.id));
      setEditing(null);
      toast(`${mod.noun} deleted`, "info");
    } catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(false); }
  }

  return (
    <>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4">
        <Link href="/dashboard" className="btn-ghost !px-3" aria-label="Back to apps"><ArrowLeft className="size-4" /></Link>
        <span className="flex size-12 items-center justify-center rounded-2xl text-white shadow-soft" style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}bb)` }}><Icon className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{app.name}</h1>
          <p className="text-sm text-slate">{app.blurb}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-xl border border-line bg-white p-1 sm:flex">
            <button onClick={() => switchView("kanban")} className={`rounded-lg p-2 ${view === "kanban" ? "bg-primary text-white" : "text-slate hover:text-ink"}`} aria-label="Kanban view"><Columns3 className="size-4" /></button>
            <button onClick={() => switchView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-primary text-white" : "text-slate hover:text-ink"}`} aria-label="List view"><List className="size-4" /></button>
          </div>
          <button onClick={() => openNew()} className="btn-primary"><Plus className="size-4" /> New {mod.noun.toLowerCase()}</button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: mod.nounPlural, value: records ? String(filtered.length) : "–" },
          { label: lastStage, value: records ? String(doneCount) : "–" },
          { label: mod.amountLabel ? `Total ${mod.amountLabel.toLowerCase()}` : "Active", value: records ? (mod.amountLabel ? fmt(total) : String(filtered.length - doneCount)) : "–" },
          { label: "Stages", value: String(mod.stages.length) },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wider text-mist">{s.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="mt-5 flex items-center gap-2">
        <label className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${mod.nounPlural.toLowerCase()}…`} className="field !pl-10" />
        </label>
        {q && <button onClick={() => setQ("")} className="btn-ghost !px-3"><X className="size-4" /></button>}
      </div>

      {/* Body */}
      {!records ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}</div>
      ) : view === "kanban" ? (
        <div className="mt-6 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {mod.stages.map((stage) => {
            const items = filtered.filter((r) => r.stage === stage);
            const col = stageColor(mod, stage);
            return (
              <div key={stage} className="flex w-72 shrink-0 flex-col rounded-2xl bg-white/60 p-3 ring-1 ring-line">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="size-2.5 rounded-full" style={{ background: col }} />
                  <h3 className="text-sm font-bold text-ink">{stage}</h3>
                  <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-slate">{items.length}</span>
                  <button onClick={() => openNew(stage)} className="rounded-md p-1 text-mist hover:bg-primary-soft hover:text-primary" aria-label={`Add to ${stage}`}><Plus className="size-4" /></button>
                </div>
                <div className="flex min-h-24 flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {items.map((r) => (
                      <motion.button
                        key={r.id} layout type="button" onClick={() => openEdit(r)}
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -2 }} className="group rounded-xl border border-line bg-white p-3 text-left shadow-soft transition-shadow hover:shadow-lift"
                      >
                        <p className="text-sm font-semibold text-ink">{r.title}</p>
                        {r.partner && <p className="mt-0.5 text-xs text-slate">{r.partner}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold tabular-nums text-primary">{r.amount != null && mod.amountLabel ? fmt(r.amount) : ""}</span>
                          <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); move(r, -1); }} onKeyDown={(e) => e.key === "Enter" && move(r, -1)} className={`rounded p-1 text-mist hover:bg-surface hover:text-ink ${mod.stages.indexOf(r.stage) === 0 ? "invisible" : ""}`}><ChevronLeft className="size-4" /></span>
                            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); move(r, 1); }} onKeyDown={(e) => e.key === "Enter" && move(r, 1)} className={`rounded p-1 text-mist hover:bg-surface hover:text-ink ${r.stage === lastStage ? "invisible" : ""}`}><ChevronRight className="size-4" /></span>
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-line py-6 text-center text-xs text-mist">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-mist">
              <tr>
                <th className="px-4 py-3">{mod.noun}</th>
                {mod.partnerLabel && <th className="hidden px-4 py-3 sm:table-cell">{mod.partnerLabel}</th>}
                <th className="px-4 py-3">Stage</th>
                {mod.amountLabel && <th className="px-4 py-3 text-right">{mod.amountLabel}</th>}
                <th className="hidden px-4 py-3 md:table-cell">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => openEdit(r)} className="cursor-pointer border-t border-line transition-colors hover:bg-primary-soft/40">
                  <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                  {mod.partnerLabel && <td className="hidden px-4 py-3 text-slate sm:table-cell">{r.partner}</td>}
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: stageColor(mod, r.stage) }}>{r.stage}</span></td>
                  {mod.amountLabel && <td className="px-4 py-3 text-right tabular-nums text-ink">{r.amount != null ? fmt(r.amount) : "–"}</td>}
                  <td className="hidden px-4 py-3 text-xs text-mist md:table-cell">{new Date(r.updatedAt + "Z").toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate">No {mod.nounPlural.toLowerCase()} yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-midnight/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
            <motion.aside
              initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-lift" role="dialog" aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h2 className="text-lg font-bold text-ink">{editing === "new" ? `New ${mod.noun.toLowerCase()}` : `Edit ${mod.noun.toLowerCase()}`}</h2>
                <button onClick={() => setEditing(null)} className="rounded-lg p-2 text-mist hover:bg-surface hover:text-ink" aria-label="Close"><X className="size-5" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <Input id="title" label={`${mod.noun} name`} value={draft.title} onChange={(e) => { setDraft({ ...draft, title: e.target.value }); setErr({}); }} error={err.title} autoFocus />
                <Select id="stage" label="Stage" options={mod.stages.map((s) => ({ id: s, label: s }))} value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value })} />
                {mod.partnerLabel && <Input id="partner" label={mod.partnerLabel} value={draft.partner} onChange={(e) => setDraft({ ...draft, partner: e.target.value })} />}
                {mod.amountLabel && <Input id="amount" type="number" step="any" inputMode="decimal" label={mod.amountLabel} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} error={err.amount} />}
                <div>
                  <label htmlFor="notes" className="field-label">Notes</label>
                  <textarea id="notes" rows={5} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="field resize-none" />
                </div>
              </form>
              <div className="flex items-center gap-2 border-t border-line px-6 py-4">
                {editing !== "new" && (
                  <button type="button" onClick={() => remove(editing)} disabled={busy} className="btn-ghost !px-3 text-danger hover:!border-danger" aria-label="Delete"><Trash2 className="size-4" /></button>
                )}
                <span className="flex-1" />
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
                <button type="button" onClick={save} disabled={busy} className="btn-primary">{busy ? <><Spinner /> Saving…</> : editing === "new" ? "Create" : "Save"}</button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
