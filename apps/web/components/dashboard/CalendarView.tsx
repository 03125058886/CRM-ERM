"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, Trash2, X } from "lucide-react";
import { EVENT_COLORS, type CalendarEvent } from "@zuvora/shared";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Input, Spinner } from "@/components/Field";

type Draft = { title: string; start: string; end: string; allDay: boolean; location: string; partner: string; notes: string; color: string };

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView() {
  const { toast } = useToast();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | "new" | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = new Date(monthStart); gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const cells = useMemo(() => Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; }), [gridStart]);

  const load = () => {
    const from = cells[0].toISOString(); const to = new Date(cells[41].getTime() + 86_400_000).toISOString();
    api<{ events: CalendarEvent[] }>(`/calendar/events?from=${from}&to=${to}`).then((r) => setEvents(r.events)).catch((e: ApiError) => { toast(e.message, "error"); setEvents([]); });
  };
  useEffect(load, [cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  const eventsOn = (d: Date) => (events ?? []).filter((e) => { const s = new Date(e.start), en = new Date(e.end); return s < new Date(d.getTime() + 86_400_000) && en > d && (sameDay(s, d) || e.allDay || s < d); }).filter((e) => sameDay(new Date(e.start), d) || new Date(e.start) < d);

  function openNew(d: Date) {
    const s = new Date(d); s.setHours(sameDay(d, today) ? Math.min(23, today.getHours() + 1) : 10, 0, 0, 0);
    const e = new Date(s); e.setHours(s.getHours() + 1);
    setDraft({ title: "", start: toLocalInput(s), end: toLocalInput(e), allDay: false, location: "", partner: "", notes: "", color: EVENT_COLORS[0] });
    setErr(undefined); setEditing("new");
  }
  function openEdit(ev: CalendarEvent) {
    setDraft({ title: ev.title, start: toLocalInput(new Date(ev.start)), end: toLocalInput(new Date(ev.end)), allDay: ev.allDay, location: ev.location, partner: ev.partner, notes: ev.notes, color: ev.color });
    setErr(undefined); setEditing(ev);
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return setErr("Title is required");
    setBusy(true);
    try {
      const body = { ...draft, start: new Date(draft.start).toISOString(), end: new Date(draft.end).toISOString() };
      if (editing === "new") { const r = await api<{ event: CalendarEvent }>("/calendar/events", { body }); setEvents((l) => [...(l ?? []), r.event]); toast("Event created", "success"); }
      else if (editing) { const r = await api<{ event: CalendarEvent }>(`/calendar/events/${editing.id}`, { method: "PATCH", body }); setEvents((l) => (l ?? []).map((x) => (x.id === r.event.id ? r.event : x))); toast("Saved", "success"); }
      setEditing(null);
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  }
  async function remove(ev: CalendarEvent) {
    setBusy(true);
    try { await api(`/calendar/events/${ev.id}`, { method: "DELETE" }); setEvents((l) => (l ?? []).filter((x) => x.id !== ev.id)); setEditing(null); toast("Event deleted", "info"); }
    catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(false); }
  }

  const upcoming = (events ?? []).filter((e) => new Date(e.end) >= today).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Calendar</h1>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="btn-ghost !px-2.5" aria-label="Previous month"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))} className="btn-ghost text-sm">Today</button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="btn-ghost !px-2.5" aria-label="Next month"><ChevronRight className="size-4" /></button>
          <span className="mx-2 w-36 text-center text-base font-bold text-ink">{cursor.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
          <button onClick={() => openNew(today)} className="btn-primary"><Plus className="size-4" /> New</button>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <div className="grid grid-cols-7 border-b border-line bg-surface text-center text-[11px] font-semibold uppercase tracking-wider text-mist">
            {DAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = sameDay(d, today);
              const evs = eventsOn(d);
              return (
                <div key={i} onClick={() => openNew(d)} className={`min-h-[84px] cursor-pointer border-b border-r border-line p-1.5 transition-colors hover:bg-primary-soft/40 sm:min-h-[104px] ${inMonth ? "" : "bg-surface/60 text-mist"}`}>
                  <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-primary text-white" : inMonth ? "text-ink" : "text-mist"}`}>{d.getDate()}</span>
                  <div className="mt-1 space-y-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <button key={e.id} onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} className="block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium text-white" style={{ background: e.color }}>
                        {!e.allDay && <span className="opacity-80">{new Date(e.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} </span>}{e.title}
                      </button>
                    ))}
                    {evs.length > 3 && <p className="px-1 text-[10px] text-mist">+{evs.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mist">Upcoming</h2>
          {events === null ? <div className="h-40 shimmer rounded-2xl" /> : upcoming.length === 0 ? <p className="text-sm text-slate">Nothing scheduled. Click a day to add an event.</p> : upcoming.map((e) => (
            <button key={e.id} onClick={() => openEdit(e)} className="flex w-full gap-3 rounded-2xl border border-line bg-white p-3 text-left shadow-soft transition-shadow hover:shadow-lift">
              <span className="mt-1 w-1 shrink-0 rounded-full" style={{ background: e.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{e.title}</span>
                <span className="flex items-center gap-1 text-xs text-slate"><Clock className="size-3" /> {new Date(e.start).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                {e.location && <span className="flex items-center gap-1 text-xs text-slate"><MapPin className="size-3" /> {e.location}</span>}
              </span>
            </button>
          ))}
        </aside>
      </div>

      <AnimatePresence>
        {editing && draft && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/40 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setEditing(null)}>
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl bg-white shadow-lift sm:rounded-3xl" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h2 className="text-lg font-bold text-ink">{editing === "new" ? "New event" : "Edit event"}</h2>
                <button onClick={() => setEditing(null)} className="rounded-lg p-2 text-mist hover:bg-surface hover:text-ink" aria-label="Close"><X className="size-5" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); save(); }} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
                <Input id="title" label="Title" value={draft.title} onChange={(e) => { setDraft({ ...draft, title: e.target.value }); setErr(undefined); }} error={err} autoFocus />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input id="start" type="datetime-local" label="Starts" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
                  <Input id="end" type="datetime-local" label="Ends" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate"><input type="checkbox" checked={draft.allDay} onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })} className="size-4 accent-primary" /> All day</label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input id="location" label="Location" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
                  <Input id="partner" label="With" value={draft.partner} onChange={(e) => setDraft({ ...draft, partner: e.target.value })} />
                </div>
                <div>
                  <span className="field-label">Color</span>
                  <div className="flex gap-2">
                    {EVENT_COLORS.map((c) => <button type="button" key={c} onClick={() => setDraft({ ...draft, color: c })} className={`size-7 rounded-full ring-2 ring-offset-2 transition-transform ${draft.color === c ? "scale-110 ring-ink" : "ring-transparent"}`} style={{ background: c }} aria-label={c} />)}
                  </div>
                </div>
                <div><label htmlFor="notes" className="field-label">Notes</label><textarea id="notes" rows={3} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="field resize-none" /></div>
              </form>
              <div className="flex items-center gap-2 border-t border-line px-6 py-4">
                {editing !== "new" && <button type="button" onClick={() => remove(editing)} disabled={busy} className="btn-ghost !px-3 text-danger" aria-label="Delete"><Trash2 className="size-4" /></button>}
                <span className="flex-1" />
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
                <button type="button" onClick={save} disabled={busy} className="btn-primary">{busy ? <><Spinner /> Saving…</> : editing === "new" ? "Create" : "Save"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
