"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Mail, MapPin, Phone, Plus, Search, Trash2, User as UserIcon, X } from "lucide-react";
import { COUNTRIES, type Contact } from "@zuvora/shared";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Input, Select, Spinner } from "@/components/Field";

type Draft = { name: string; type: "person" | "company"; company: string; jobTitle: string; email: string; phone: string; city: string; country: string; tags: string; notes: string };
const empty: Draft = { name: "", type: "person", company: "", jobTitle: "", email: "", phone: "", city: "", country: "", tags: "", notes: "" };
const TAG_COLORS: Record<string, string> = { Customer: "#22D3A5", Prospect: "#8A7DFF", Vendor: "#FFB020", "My company": "#5B4BFF" };

export function ContactsView() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "person" | "company">("all");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Partial<Draft>>({});

  useEffect(() => {
    api<{ contacts: Contact[] }>("/contacts").then((r) => setContacts(r.contacts)).catch((e: ApiError) => { toast(e.message, "error"); setContacts([]); });
  }, [toast]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (contacts ?? []).filter((c) => (type === "all" || c.type === type) && (!k || [c.name, c.company, c.email, c.phone, c.city, c.tags.join(" ")].join(" ").toLowerCase().includes(k)));
  }, [contacts, q, type]);

  function openNew() { setDraft(empty); setErr({}); setEditing("new"); }
  function openEdit(c: Contact) { setDraft({ ...c, tags: c.tags.join(", ") }); setErr({}); setEditing(c); }

  async function save() {
    if (!draft.name.trim()) return setErr({ name: "Name is required" });
    setBusy(true);
    try {
      if (editing === "new") { const r = await api<{ contact: Contact }>("/contacts", { body: draft }); setContacts((l) => [...(l ?? []), r.contact].sort((a, b) => a.name.localeCompare(b.name))); toast("Contact created", "success"); }
      else if (editing) { const r = await api<{ contact: Contact }>(`/contacts/${editing.id}`, { method: "PATCH", body: draft }); setContacts((l) => (l ?? []).map((x) => (x.id === r.contact.id ? r.contact : x))); toast("Saved", "success"); }
      setEditing(null);
    } catch (e) { const ae = e as ApiError; if (ae.field) setErr({ [ae.field]: ae.message }); else toast(ae.message, "error"); } finally { setBusy(false); }
  }
  async function remove(c: Contact) {
    setBusy(true);
    try { await api(`/contacts/${c.id}`, { method: "DELETE" }); setContacts((l) => (l ?? []).filter((x) => x.id !== c.id)); setEditing(null); toast("Contact deleted", "info"); }
    catch (e) { toast((e as ApiError).message, "error"); } finally { setBusy(false); }
  }

  const initials = (n: string) => n.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Contacts</h1>
          <p className="text-sm text-slate">{contacts ? `${contacts.length} contacts` : "Loading…"}</p>
        </div>
        <div className="flex rounded-xl border border-line bg-white p-1 text-sm">
          {(["all", "person", "company"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-lg px-3 py-1.5 font-medium capitalize ${type === t ? "bg-primary text-white" : "text-slate hover:text-ink"}`}>{t === "person" ? "People" : t === "company" ? "Companies" : "All"}</button>
          ))}
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="field !w-44 !pl-9 sm:!w-60" />
        </label>
        <button onClick={openNew} className="btn-primary"><Plus className="size-4" /> New</button>
      </motion.div>

      {contacts === null ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 shimmer rounded-2xl" />)}</div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => (
              <motion.button key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(i, 10) * 0.03 }} onClick={() => openEdit(c)} className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-soft transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lift">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${c.type === "company" ? "bg-midnight" : "bg-gradient-to-br from-primary to-accent"}`}>
                  {c.type === "company" ? <Building2 className="size-5" /> : initials(c.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                  {(c.jobTitle || c.company) && <span className="block truncate text-xs text-slate">{[c.jobTitle, c.company].filter(Boolean).join(" · ")}</span>}
                  {c.email && <span className="mt-1 flex items-center gap-1 truncate text-xs text-slate"><Mail className="size-3" /> {c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1 truncate text-xs text-slate"><Phone className="size-3" /> {c.phone}</span>}
                  {(c.city || c.country) && <span className="flex items-center gap-1 truncate text-xs text-slate"><MapPin className="size-3" /> {[c.city, c.country].filter(Boolean).join(", ")}</span>}
                  {c.tags.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {c.tags.map((t) => <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: TAG_COLORS[t] ?? "#9AA3C2" }}>{t}</span>)}
                    </span>
                  )}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <p className="col-span-full py-16 text-center text-slate">No contacts match.</p>}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex justify-end bg-midnight/40 backdrop-blur-sm" onClick={() => setEditing(null)}>
            <motion.aside initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 34 }} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-lift" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h2 className="text-lg font-bold text-ink">{editing === "new" ? "New contact" : "Edit contact"}</h2>
                <button onClick={() => setEditing(null)} className="rounded-lg p-2 text-mist hover:bg-surface hover:text-ink" aria-label="Close"><X className="size-5" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="flex gap-2">
                  {(["person", "company"] as const).map((t) => (
                    <button type="button" key={t} onClick={() => setDraft({ ...draft, type: t })} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${draft.type === t ? "border-primary bg-primary-soft text-primary" : "border-line text-slate"}`}>
                      {t === "person" ? <UserIcon className="size-4" /> : <Building2 className="size-4" />} {t === "person" ? "Individual" : "Company"}
                    </button>
                  ))}
                </div>
                <Input id="name" label={draft.type === "company" ? "Company name" : "Full name"} value={draft.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setErr({}); }} error={err.name} autoFocus />
                {draft.type === "person" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input id="jobTitle" label="Job title" value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} />
                    <Input id="company" label="Company" value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
                  </div>
                )}
                <Input id="email" type="email" label="Email" value={draft.email} onChange={(e) => { setDraft({ ...draft, email: e.target.value }); setErr({}); }} error={err.email} />
                <Input id="phone" type="tel" label="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input id="city" label="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                  <Select id="country" label="Country" options={COUNTRIES} placeholder="—" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} />
                </div>
                <Input id="tags" label="Tags" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} hint="Comma separated, e.g. Customer, VIP" />
                <div><label htmlFor="notes" className="field-label">Notes</label><textarea id="notes" rows={4} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="field resize-none" /></div>
              </form>
              <div className="flex items-center gap-2 border-t border-line px-6 py-4">
                {editing !== "new" && <button type="button" onClick={() => remove(editing)} disabled={busy} className="btn-ghost !px-3 text-danger" aria-label="Delete"><Trash2 className="size-4" /></button>}
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
