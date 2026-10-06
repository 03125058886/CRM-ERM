"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Columns3, GripVertical, List, Plus, Search, Trash2, X } from "lucide-react";
import { moduleFor, type AppDef, type ModuleDef, type RecordNote, type RecordRow, type WorkspaceView } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Spinner } from "@/components/Field";
import { AppMenuBar } from "./AppMenuBar";

const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
const when = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const stageColor = (stages: string[], stage: string) => {
  const i = stages.indexOf(stage);
  if (/lost|cancel|refus|fail|scrap|archiv|no-show/i.test(stage)) return "#E5484D";
  if (i === stages.length - 1 || /won|done|paid|solved|published|hired|repaired|signed|live|reconciled|reimbursed/i.test(stage)) return "#22D3A5";
  return ["#5B4BFF", "#8A7DFF", "#FFB020"][i % 3];
};

const VIEWS: WorkspaceView[] = ["kanban", "list", "report", "activity", "stages"];

export function Workspace({ app }: { app: AppDef }) {
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const v = params.get("view");
  const view: WorkspaceView = VIEWS.includes(v as WorkspaceView) ? (v as WorkspaceView) : "kanban";

  const [mod, setMod] = useState<ModuleDef>(() => moduleFor(app.id));
  const [records, setRecords] = useState<RecordRow[] | null>(null);
  const [q, setQ] = useState("");

  const load = () => {
    api<{ module: ModuleDef; records: RecordRow[] }>(`/apps/${app.id}/records`)
      .then((r) => { setMod(r.module); setRecords(r.records); })
      .catch((e: ApiError) => { toast(e.message, "error"); setRecords([]); });
  };
  useEffect(load, [app.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (records ?? []).filter((r) => !k || r.title.toLowerCase().includes(k) || r.partner.toLowerCase().includes(k) || r.notes.toLowerCase().includes(k));
  }, [records, q]);
  const lastStage = mod.stages[mod.stages.length - 1];
  const total = filtered.reduce((s, r) => s + (r.amount ?? 0), 0);
  const doneCount = filtered.filter((r) => r.stage === lastStage).length;

  async function move(r: RecordRow, dir: 1 | -1) {
    const next = mod.stages[mod.stages.indexOf(r.stage) + dir];
    if (!next) return;
    setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? { ...x, stage: next } : x)));
    try { const res = await api<{ record: RecordRow }>(`/records/${r.id}`, { method: "PATCH", body: { stage: next } }); setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? res.record : x))); }
    catch (e) { setRecords((l) => (l ?? []).map((x) => (x.id === r.id ? r : x))); toast((e as ApiError).message, "error"); }
  }
  const open = (r: RecordRow) => router.push(`/dashboard/${app.id}/${r.id}`);
  const setView = (nv: WorkspaceView) => router.replace(`/dashboard/${app.id}?view=${nv}`);

  const titles: Record<WorkspaceView, string> = { kanban: app.id === "crm" ? "My Pipeline" : app.id === "sales" ? "Quotations" : `${mod.noun} board`, list: app.id === "crm" ? "Leads" : app.id === "sales" ? "Orders" : app.id === "invoicing" ? "Invoices" : mod.nounPlural, report: `${mod.noun} analysis`, activity: "Activity", stages: "Stages" };

  return (
    <>
      <AppMenuBar app={app} view={view} />

      {/* Control panel */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-ink">{titles[view]}</h1>
        {(view === "kanban" || view === "list") && (
          <Link href={`/dashboard/${app.id}/new`} className="btn-primary !py-2"><Plus className="size-4" /> New</Link>
        )}
        <span className="flex-1" />
        {(view === "kanban" || view === "list") && (
          <>
            <label className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${mod.nounPlural.toLowerCase()}…`} className="field !py-2 !pl-10" />
              {q && <button onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist hover:text-ink" aria-label="Clear"><X className="size-4" /></button>}
            </label>
            <div className="flex rounded-xl border border-line bg-white p-1">
              <button onClick={() => setView("kanban")} className={`rounded-lg p-2 ${view === "kanban" ? "bg-primary text-white" : "text-slate hover:text-ink"}`} aria-label="Kanban"><Columns3 className="size-4" /></button>
              <button onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-primary text-white" : "text-slate hover:text-ink"}`} aria-label="List"><List className="size-4" /></button>
            </div>
          </>
        )}
      </motion.div>

      {!records ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-48 shimmer rounded-2xl" />)}</div>
      ) : view === "kanban" ? (
        <div className="mt-5 -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {mod.stages.map((stage) => {
            const items = filtered.filter((r) => r.stage === stage);
            const sum = items.reduce((s, r) => s + (r.amount ?? 0), 0);
            return (
              <div key={stage} className="flex w-72 shrink-0 flex-col rounded-2xl bg-white/60 p-3 ring-1 ring-line">
                <div className="mb-1 flex items-center gap-2 px-1">
                  <span className="size-2.5 rounded-full" style={{ background: stageColor(mod.stages, stage) }} />
                  <h3 className="text-sm font-bold text-ink">{stage}</h3>
                  <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-slate">{items.length}</span>
                  <Link href={`/dashboard/${app.id}/new?stage=${encodeURIComponent(stage)}`} className="rounded-md p-1 text-mist hover:bg-primary-soft hover:text-primary" aria-label={`Add to ${stage}`}><Plus className="size-4" /></Link>
                </div>
                {mod.amountLabel && <p className="mb-2 px-1 text-xs tabular-nums text-mist">{fmt(sum)}</p>}
                <div className="flex min-h-24 flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {items.map((r) => (
                      <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -2 }} onClick={() => open(r)} className="group cursor-pointer rounded-xl border border-line bg-white p-3 shadow-soft transition-shadow hover:shadow-lift">
                        <p className="text-sm font-semibold text-ink">{r.title}</p>
                        {r.partner && <p className="mt-0.5 text-xs text-slate">{r.partner}</p>}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs font-semibold tabular-nums text-primary">{r.amount != null && mod.amountLabel ? fmt(r.amount) : ""}</span>
                          <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); move(r, -1); }} className={`rounded p-1 text-mist hover:bg-surface hover:text-ink ${mod.stages.indexOf(r.stage) === 0 ? "invisible" : ""}`} aria-label="Previous stage"><ChevronLeft className="size-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); move(r, 1); }} className={`rounded p-1 text-mist hover:bg-surface hover:text-ink ${r.stage === lastStage ? "invisible" : ""}`} aria-label="Next stage"><ChevronRight className="size-4" /></button>
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-line py-6 text-center text-xs text-mist">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === "list" ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
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
                <tr key={r.id} onClick={() => open(r)} className="cursor-pointer border-t border-line transition-colors hover:bg-primary-soft/40">
                  <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                  {mod.partnerLabel && <td className="hidden px-4 py-3 text-slate sm:table-cell">{r.partner}</td>}
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: stageColor(mod.stages, r.stage) }}>{r.stage}</span></td>
                  {mod.amountLabel && <td className="px-4 py-3 text-right tabular-nums text-ink">{r.amount != null ? fmt(r.amount) : "–"}</td>}
                  <td className="hidden px-4 py-3 text-xs text-mist md:table-cell">{when(r.updatedAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate">No {mod.nounPlural.toLowerCase()} yet.</td></tr>}
            </tbody>
            {mod.amountLabel && filtered.length > 0 && (
              <tfoot><tr className="border-t border-line bg-surface font-semibold text-ink"><td className="px-4 py-2.5" colSpan={mod.partnerLabel ? 3 : 2}>Total · {filtered.length} {mod.nounPlural.toLowerCase()}</td><td className="px-4 py-2.5 text-right tabular-nums">{fmt(total)}</td><td className="hidden md:table-cell" /></tr></tfoot>
            )}
          </table>
        </div>
      ) : view === "report" ? (
        <Report mod={mod} records={records} total={total} doneCount={doneCount} />
      ) : view === "activity" ? (
        <Activity appId={app.id} />
      ) : (
        <StagesConfig appId={app.id} stages={mod.stages} onSaved={(s) => { setMod({ ...mod, stages: s }); load(); }} />
      )}
    </>
  );
}

/* ---------- Reporting → analysis ---------- */
function Report({ mod, records, total, doneCount }: { mod: ModuleDef; records: RecordRow[]; total: number; doneCount: number }) {
  const byStage = mod.stages.map((stage) => { const rs = records.filter((r) => r.stage === stage); return { stage, count: rs.length, amount: rs.reduce((s, r) => s + (r.amount ?? 0), 0) }; });
  const partners = Object.values(records.reduce<Record<string, { partner: string; count: number; amount: number }>>((acc, r) => { if (!r.partner) return acc; acc[r.partner] ??= { partner: r.partner, count: 0, amount: 0 }; acc[r.partner].count++; acc[r.partner].amount += r.amount ?? 0; return acc; }, {})).sort((a, b) => b.amount - a.amount || b.count - a.count).slice(0, 8);
  const [measure, setMeasure] = useState<"count" | "amount">(mod.amountLabel ? "amount" : "count");
  const max = Math.max(1, ...byStage.map((s) => s[measure]));
  const pmax = Math.max(1, ...partners.map((p) => p[measure]));
  const won = records.length ? Math.round((doneCount / records.length) * 100) : 0;
  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{ l: mod.nounPlural, v: String(records.length) }, { l: mod.stages[mod.stages.length - 1], v: String(doneCount) }, { l: mod.amountLabel ? `Total ${mod.amountLabel.toLowerCase()}` : "Open", v: mod.amountLabel ? fmt(total) : String(records.length - doneCount) }, { l: "Completion rate", v: `${won}%` }].map((k) => (
          <div key={k.l} className="rounded-2xl border border-line bg-white p-4 shadow-soft"><p className="text-xs font-medium uppercase tracking-wider text-mist">{k.l}</p><p className="mt-1 text-2xl font-bold tabular-nums text-ink">{k.v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">By stage</h3>
            {mod.amountLabel && <div className="flex rounded-lg border border-line p-0.5 text-xs">{(["count", "amount"] as const).map((m) => <button key={m} onClick={() => setMeasure(m)} className={`rounded-md px-2 py-1 font-medium capitalize ${measure === m ? "bg-primary text-white" : "text-slate"}`}>{m === "amount" ? mod.amountLabel : "Count"}</button>)}</div>}
          </div>
          <ul className="space-y-2">
            {byStage.map((s) => (
              <li key={s.stage} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate text-slate">{s.stage}</span>
                <span className="relative h-5 flex-1 rounded-r-[4px] bg-surface"><motion.span initial={{ width: 0 }} animate={{ width: `${(s[measure] / max) * 100}%` }} transition={{ duration: 0.5 }} className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ background: stageColor(mod.stages, s.stage) }} /></span>
                <span className="w-20 shrink-0 text-right tabular-nums text-ink">{fmt(s[measure])}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-bold text-ink">Top {mod.partnerLabel?.toLowerCase() ?? "partners"}</h3>
          {partners.length === 0 ? <p className="py-6 text-center text-sm text-mist">No data yet.</p> : (
            <ul className="space-y-2">
              {partners.map((p) => (
                <li key={p.partner} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate text-slate">{p.partner}</span>
                  <span className="relative h-5 flex-1 rounded-r-[4px] bg-surface"><motion.span initial={{ width: 0 }} animate={{ width: `${(p[measure] / pmax) * 100}%` }} transition={{ duration: 0.5 }} className="absolute inset-y-0 left-0 rounded-r-[4px] bg-primary" /></span>
                  <span className="w-20 shrink-0 text-right tabular-nums text-ink">{fmt(p[measure])}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Reporting → activity ---------- */
function Activity({ appId }: { appId: string }) {
  const [items, setItems] = useState<(RecordNote & { recordTitle?: string })[] | null>(null);
  useEffect(() => { api<{ activity: (RecordNote & { recordTitle?: string })[] }>(`/apps/${appId}/activity`).then((r) => setItems(r.activity)).catch(() => setItems([])); }, [appId]);
  if (!items) return <div className="mt-5 h-48 shimmer rounded-2xl" />;
  return (
    <ol className="mt-5 space-y-2">
      {items.map((n) => (
        <li key={n.id} className="flex gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-soft">
          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.kind === "log" ? "bg-mist" : "bg-primary"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-mist"><span className="font-semibold text-slate">{n.author}</span> · {when(n.createdAt)} · <Link href={`/dashboard/${appId}/${n.recordId}`} className="text-primary hover:underline">{n.recordTitle}</Link></p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{n.body}</p>
          </div>
        </li>
      ))}
      {items.length === 0 && <p className="py-10 text-center text-slate">No activity yet.</p>}
    </ol>
  );
}

/* ---------- Configuration → stages ---------- */
function StagesConfig({ appId, stages, onSaved }: { appId: string; stages: string[]; onSaved: (s: string[]) => void }) {
  const { toast } = useToast();
  const [rows, setRows] = useState(() => stages.map((s) => ({ key: s, name: s })));
  const [busy, setBusy] = useState(false);
  useEffect(() => { setRows(stages.map((s) => ({ key: s, name: s }))); }, [stages]);
  const moveRow = (i: number, d: -1 | 1) => setRows((r) => { const n = r.slice(); const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });
  async function save() {
    const names = rows.map((r) => r.name.trim()).filter(Boolean);
    const renames: Record<string, string> = {};
    rows.forEach((r) => { if (r.key && r.key !== r.name.trim() && r.name.trim()) renames[r.key] = r.name.trim(); });
    setBusy(true);
    try { const r = await api<{ stages: string[] }>(`/apps/${appId}/stages`, { method: "PUT", body: { stages: names, renames } }); onSaved(r.stages); toast("Stages saved", "success"); }
    catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(false); }
  }
  return (
    <div className="mt-5 max-w-xl rounded-2xl border border-line bg-white p-5 shadow-soft">
      <p className="text-sm text-slate">Rename, reorder, add or remove the pipeline stages for this app. Records in a removed stage move to the first stage.</p>
      <ul className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <GripVertical className="size-4 text-mist" />
            <span className="size-3 rounded-full" style={{ background: stageColor(rows.map((x) => x.name), r.name) }} />
            <input value={r.name} onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="field !py-2" />
            <button onClick={() => moveRow(i, -1)} className="rounded-lg p-2 text-mist hover:bg-surface hover:text-ink" aria-label="Move up"><ArrowUp className="size-4" /></button>
            <button onClick={() => moveRow(i, 1)} className="rounded-lg p-2 text-mist hover:bg-surface hover:text-ink" aria-label="Move down"><ArrowDown className="size-4" /></button>
            <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="rounded-lg p-2 text-mist hover:bg-danger/10 hover:text-danger" aria-label="Remove"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2">
        <button onClick={() => setRows((rs) => [...rs, { key: "", name: "" }])} className="btn-ghost !py-2"><Plus className="size-4" /> Add stage</button>
        <span className="flex-1" />
        <button onClick={save} disabled={busy} className="btn-primary !py-2">{busy ? <><Spinner /> Saving…</> : "Save"}</button>
      </div>
    </div>
  );
}
