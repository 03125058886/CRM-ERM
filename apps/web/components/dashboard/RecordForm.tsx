"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Clock, MessageSquare, Send, Trash2 } from "lucide-react";
import { moduleFor, type AppDef, type ModuleDef, type RecordNote, type RecordRow } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Input, Spinner } from "@/components/Field";
import { AppMenuBar } from "./AppMenuBar";
import { stageColor } from "./Workspace";

type Draft = { title: string; stage: string; amount: string; partner: string; notes: string };
const when = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** Odoo-style full-page form: breadcrumb, statusbar, fields, chatter. */
export function RecordForm({ app, recordId }: { app: AppDef; recordId: number | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [mod, setMod] = useState<ModuleDef>(() => moduleFor(app.id));
  const [record, setRecord] = useState<RecordRow | null>(null);
  const [notes, setNotes] = useState<RecordNote[]>([]);
  const [draft, setDraft] = useState<Draft>({ title: "", stage: params.get("stage") ?? moduleFor(app.id).stages[0], amount: "", partner: "", notes: "" });
  const [loading, setLoading] = useState(recordId !== null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Partial<Draft>>({});
  const [chat, setChat] = useState("");
  const [dirty, setDirty] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recordId === null) {
      api<{ module: ModuleDef }>(`/apps/${app.id}/records`).then((r) => { setMod(r.module); setDraft((d) => ({ ...d, stage: r.module.stages.includes(d.stage) ? d.stage : r.module.stages[0] })); }).catch(() => {});
      setTimeout(() => titleRef.current?.focus(), 50);
      return;
    }
    api<{ record: RecordRow; module: ModuleDef; notes: RecordNote[] }>(`/records/${recordId}`)
      .then((r) => { setRecord(r.record); setMod(r.module); setNotes(r.notes); setDraft({ title: r.record.title, stage: r.record.stage, amount: r.record.amount == null ? "" : String(r.record.amount), partner: r.record.partner, notes: r.record.notes }); })
      .catch((e: ApiError) => { toast(e.message, "error"); router.replace(`/dashboard/${app.id}`); })
      .finally(() => setLoading(false));
  }, [app.id, recordId, router, toast]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft((d) => ({ ...d, [k]: v })); setErr({}); setDirty(true); };

  async function save(extra?: Partial<Draft>) {
    const d = { ...draft, ...extra };
    if (!d.title.trim()) { setErr({ title: `${mod.noun} name is required` }); titleRef.current?.focus(); return; }
    setBusy(true);
    try {
      const body = { ...d, amount: d.amount === "" ? null : Number(d.amount) };
      if (record) {
        const r = await api<{ record: RecordRow; notes: RecordNote[] }>(`/records/${record.id}`, { method: "PATCH", body });
        setRecord(r.record); setNotes(r.notes); setDraft({ ...d }); setDirty(false);
        toast("Saved", "success");
      } else {
        const r = await api<{ record: RecordRow }>(`/apps/${app.id}/records`, { body });
        toast(`${mod.noun} created`, "success");
        router.replace(`/dashboard/${app.id}/${r.record.id}`);
      }
    } catch (e) { const ae = e as ApiError; if (ae.field) setErr({ [ae.field]: ae.message }); else toast(ae.message, "error"); } finally { setBusy(false); }
  }

  async function setStage(stage: string) {
    if (stage === draft.stage) return;
    setDraft((d) => ({ ...d, stage }));
    if (record) await save({ stage }); else setDirty(true);
  }

  async function remove() {
    if (!record) return;
    setBusy(true);
    try { await api(`/records/${record.id}`, { method: "DELETE" }); toast(`${mod.noun} deleted`, "info"); router.replace(`/dashboard/${app.id}`); }
    catch (e) { toast((e as ApiError).message, "error"); setBusy(false); }
  }

  async function sendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!record || !chat.trim()) return;
    const body = chat.trim(); setChat("");
    try { const r = await api<{ note: RecordNote }>(`/records/${record.id}/notes`, { body: { body } }); setNotes((n) => [...n, r.note]); }
    catch (er) { toast((er as ApiError).message, "error"); }
  }

  const stageIdx = mod.stages.indexOf(draft.stage);

  return (
    <>
      <AppMenuBar app={app} />

      {/* Breadcrumb + actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/dashboard/${app.id}`} className="btn-ghost !px-2.5 !py-1.5" aria-label="Back"><ArrowLeft className="size-4" /></Link>
        <Link href={`/dashboard/${app.id}`} className="text-slate hover:text-primary">{app.id === "crm" ? "Pipeline" : mod.nounPlural}</Link>
        <span className="text-mist">/</span>
        <span className="font-semibold text-ink">{record ? record.title : `New ${mod.noun.toLowerCase()}`}</span>
        <span className="flex-1" />
        {record && <button onClick={remove} disabled={busy} className="btn-ghost !px-3 !py-1.5 text-danger" aria-label="Delete"><Trash2 className="size-4" /></button>}
        <button onClick={() => save()} disabled={busy || (!dirty && !!record)} className="btn-primary !py-1.5">{busy ? <><Spinner /> Saving…</> : record ? <><Check className="size-4" /> Save</> : "Create"}</button>
      </motion.div>

      {loading ? <div className="mt-5 h-96 shimmer rounded-2xl" /> : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* Sheet */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
            {/* Statusbar */}
            <div className="flex overflow-x-auto border-b border-line bg-surface/60">
              {mod.stages.map((s, i) => {
                const active = i === stageIdx; const past = i < stageIdx;
                return (
                  <button key={s} onClick={() => setStage(s)} className={`relative shrink-0 px-4 py-2.5 text-xs font-semibold transition-colors ${active ? "text-white" : past ? "text-ink" : "text-slate hover:text-ink"}`} style={active ? { background: stageColor(mod.stages, s) } : undefined} title={`Move to ${s}`}>
                    {past && <Check className="mr-1 inline size-3 text-mint" />}{s}
                  </button>
                );
              })}
            </div>

            <div className="p-6 sm:p-8">
              <input ref={titleRef} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder={`${mod.noun} name…`} aria-invalid={Boolean(err.title)} className="w-full border-0 bg-transparent text-2xl font-bold tracking-tight text-ink outline-none placeholder:text-mist sm:text-3xl" />
              {err.title && <p className="mt-1 text-xs text-danger">{err.title}</p>}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {mod.partnerLabel && <Input id="partner" label={mod.partnerLabel} value={draft.partner} onChange={(e) => set("partner", e.target.value)} />}
                {mod.amountLabel && <Input id="amount" type="number" step="any" inputMode="decimal" label={mod.amountLabel} value={draft.amount} onChange={(e) => set("amount", e.target.value)} error={err.amount} />}
                <div>
                  <span className="field-label">Stage</span>
                  <select value={draft.stage} onChange={(e) => setStage(e.target.value)} className="field">{mod.stages.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                {record && (
                  <div>
                    <span className="field-label">Timeline</span>
                    <p className="flex items-center gap-1.5 py-2.5 text-sm text-slate"><Clock className="size-4 text-mist" /> Created {when(record.createdAt)} · Updated {when(record.updatedAt)}</p>
                  </div>
                )}
              </div>

              <div className="mt-5">
                <label htmlFor="notes" className="field-label">Internal notes</label>
                <textarea id="notes" rows={6} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Add details, next steps, context…" className="field resize-y" />
              </div>
            </div>
          </motion.section>

          {/* Chatter */}
          <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex max-h-[70vh] flex-col rounded-2xl border border-line bg-white shadow-soft lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3"><MessageSquare className="size-4 text-primary" /><h3 className="text-sm font-bold text-ink">Chatter</h3><span className="ml-auto text-xs text-mist">{notes.length}</span></div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {!record && <p className="text-sm text-mist">Create the {mod.noun.toLowerCase()} to start logging notes.</p>}
              <AnimatePresence initial={false}>
                {notes.slice().reverse().map((n) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                    <span className={`mt-1 size-2 shrink-0 rounded-full ${n.kind === "log" ? "bg-mist" : "bg-primary"}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] text-mist"><span className="font-semibold text-slate">{n.author}</span> · {when(n.createdAt)}</p>
                      <p className={`mt-0.5 whitespace-pre-wrap text-sm ${n.kind === "log" ? "text-slate" : "rounded-xl bg-surface px-3 py-2 text-ink"}`}>{n.body}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {record && (
              <form onSubmit={sendNote} className="flex items-end gap-2 border-t border-line p-3">
                <textarea value={chat} onChange={(e) => setChat(e.target.value)} rows={1} placeholder="Log a note…" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} className="field max-h-32 min-h-[40px] flex-1 resize-none !py-2 text-sm" />
                <button type="submit" disabled={!chat.trim()} className="btn-primary !px-3 !py-2" aria-label="Send"><Send className="size-4" /></button>
              </form>
            )}
          </motion.aside>
        </div>
      )}
    </>
  );
}
