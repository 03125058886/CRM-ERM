import { Router } from "express";
import { EVENT_COLORS, type CalendarEvent, type Channel, type Contact, type Message } from "@nexora/shared";
import { requireAuth, currentUser } from "./auth.js";
import { Discuss, Events, Contacts, type ChannelRow, type MessageRow, type EventRow, type ContactRow, type EventData, type ContactData } from "./sysdb.js";

export const system = Router();
system.use(requireAuth);

const BOT = "Nexora Bot";

/* =============== Discuss =============== */
const toChannel = (c: ChannelRow): Channel => ({ id: c.id, name: c.name, description: c.description, createdAt: c.created_at, lastMessageAt: c.last_message_at, messageCount: Number(c.message_count) });
const toMessage = (m: MessageRow): Message => ({ id: m.id, channelId: m.channel_id, author: m.author, body: m.body, isBot: m.is_bot === 1, createdAt: m.created_at });

function ensureChannels(userId: number, firstName: string) {
  if (Discuss.channelCount(userId) > 0) return;
  const general = Discuss.createChannel(userId, "general", "Company-wide announcements and chatter");
  const random = Discuss.createChannel(userId, "random", "Non-work banter and water-cooler talk");
  Discuss.createChannel(userId, "Notes to self", "Only you can see this");
  Discuss.post(general, BOT, `Welcome aboard, ${firstName}! 👋 This is your team's #general channel. Invite colleagues from Settings when you're ready.`, true);
  Discuss.post(random, BOT, "Anything goes here ☕", true);
}

system.get("/discuss/channels", (req, res) => {
  const u = currentUser(req);
  ensureChannels(u.id, u.first_name);
  res.json({ channels: Discuss.channels(u.id).map(toChannel) });
});

system.post("/discuss/channels", (req, res) => {
  const u = currentUser(req);
  const name = String((req.body as { name?: string }).name ?? "").trim().replace(/^#/, "").slice(0, 40);
  if (!name) return res.status(400).json({ error: "Channel name is required", field: "name" });
  const id = Discuss.createChannel(u.id, name, String((req.body as { description?: string }).description ?? "").slice(0, 200));
  Discuss.post(id, BOT, `#${name} was created by ${u.first_name}.`, true);
  res.status(201).json({ channel: Discuss.channels(u.id).map(toChannel).find((c) => c.id === id) });
});

system.get("/discuss/channels/:id/messages", (req, res) => {
  const u = currentUser(req);
  const c = Discuss.channel(Number(req.params.id), u.id);
  if (!c) return res.status(404).json({ error: "Channel not found" });
  res.json({ channel: toChannel({ ...c, last_message_at: null, message_count: 0 }), messages: Discuss.messages(c.id).map(toMessage) });
});

system.post("/discuss/channels/:id/messages", (req, res) => {
  const u = currentUser(req);
  const c = Discuss.channel(Number(req.params.id), u.id);
  if (!c) return res.status(404).json({ error: "Channel not found" });
  const body = String((req.body as { body?: string }).body ?? "").trim().slice(0, 4000);
  if (!body) return res.status(400).json({ error: "Message cannot be empty", field: "body" });
  const m = Discuss.post(c.id, `${u.first_name} ${u.last_name}`.trim(), body);
  const extra: Message[] = [];
  // A tiny assistant so the channel feels alive.
  if (/^\/(help|hello|hi)\b/i.test(body) || /\bnexora bot\b/i.test(body)) {
    extra.push(toMessage(Discuss.post(c.id, BOT, "Hi! I'm Nexora Bot. Try: open an app from the top-left switcher, or type a note here and it stays in this channel.", true)));
  }
  res.status(201).json({ message: toMessage(m), extra });
});

/* =============== Calendar =============== */
const toEvent = (e: EventRow): CalendarEvent => ({ id: e.id, title: e.title, start: e.start, end: e.end, allDay: e.all_day === 1, location: e.location, partner: e.partner, notes: e.notes, color: e.color });

function cleanEvent(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) return { error: "Title is required", field: "title" } as const;
  const start = new Date(String(body.start ?? ""));
  const end = new Date(String(body.end ?? ""));
  if (Number.isNaN(start.getTime())) return { error: "Start date is invalid", field: "start" } as const;
  if (Number.isNaN(end.getTime()) || end <= start) return { error: "End must be after start", field: "end" } as const;
  const color = typeof body.color === "string" && EVENT_COLORS.includes(body.color) ? body.color : EVENT_COLORS[0];
  const data: EventData = {
    title, start: start.toISOString(), end: end.toISOString(), allDay: Boolean(body.allDay), color,
    location: String(body.location ?? "").slice(0, 200), partner: String(body.partner ?? "").slice(0, 120), notes: String(body.notes ?? "").slice(0, 4000),
  };
  return { data } as const;
}

function ensureEvents(userId: number) {
  if (Events.count(userId) > 0) return;
  const d = new Date(); d.setMinutes(0, 0, 0);
  const at = (days: number, hour: number, len = 1) => { const s = new Date(d); s.setDate(s.getDate() + days); s.setHours(hour); const e = new Date(s); e.setHours(hour + len); return { start: s.toISOString(), end: e.toISOString() }; };
  Events.create(userId, { title: "Welcome call with Nexora", ...at(0, 11), allDay: false, location: "Video call", partner: "Nexora team", notes: "We will walk you through your new workspace.", color: EVENT_COLORS[0] });
  Events.create(userId, { title: "Demo for Globex", ...at(2, 15), allDay: false, location: "Globex HQ", partner: "Globex", notes: "", color: EVENT_COLORS[1] });
  Events.create(userId, { title: "Team weekly", ...at(7, 10), allDay: false, location: "Meeting room 2", partner: "", notes: "", color: EVENT_COLORS[2] });
}

system.get("/calendar/events", (req, res) => {
  const u = currentUser(req);
  ensureEvents(u.id);
  const from = new Date(String(req.query.from ?? "")); const to = new Date(String(req.query.to ?? ""));
  const f = Number.isNaN(from.getTime()) ? new Date(Date.now() - 31 * 86_400_000) : from;
  const t = Number.isNaN(to.getTime()) ? new Date(Date.now() + 62 * 86_400_000) : to;
  res.json({ events: Events.range(u.id, f.toISOString(), t.toISOString()).map(toEvent) });
});
system.post("/calendar/events", (req, res) => {
  const u = currentUser(req);
  const c = cleanEvent(req.body as Record<string, unknown>);
  if ("error" in c) return res.status(400).json(c);
  res.status(201).json({ event: toEvent(Events.create(u.id, c.data)) });
});
system.patch("/calendar/events/:id", (req, res) => {
  const u = currentUser(req);
  const ex = Events.get(Number(req.params.id), u.id);
  if (!ex) return res.status(404).json({ error: "Event not found" });
  const c = cleanEvent({ ...toEvent(ex), ...(req.body as Record<string, unknown>) });
  if ("error" in c) return res.status(400).json(c);
  res.json({ event: toEvent(Events.update(ex.id, u.id, c.data)!) });
});
system.delete("/calendar/events/:id", (req, res) => {
  const u = currentUser(req);
  if (!Events.delete(Number(req.params.id), u.id)) return res.status(404).json({ error: "Event not found" });
  res.json({ ok: true });
});

/* =============== Contacts =============== */
const toContact = (c: ContactRow): Contact => ({
  id: c.id, name: c.name, type: c.type === "company" ? "company" : "person", company: c.company, jobTitle: c.job_title, email: c.email, phone: c.phone,
  city: c.city, country: c.country, tags: JSON.parse(c.tags) as string[], notes: c.notes, createdAt: c.created_at,
});

function cleanContact(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim().slice(0, 120);
  if (!name) return { error: "Name is required", field: "name" } as const;
  const email = String(body.email ?? "").trim().slice(0, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Email looks invalid", field: "email" } as const;
  const tagsRaw = body.tags;
  const tags = (Array.isArray(tagsRaw) ? tagsRaw.map(String) : String(tagsRaw ?? "").split(",")).map((t) => t.trim()).filter(Boolean).slice(0, 10);
  const data: ContactData = {
    name, type: body.type === "company" ? "company" : "person", company: String(body.company ?? "").slice(0, 120), jobTitle: String(body.jobTitle ?? "").slice(0, 120),
    email, phone: String(body.phone ?? "").slice(0, 40), city: String(body.city ?? "").slice(0, 80), country: String(body.country ?? "").slice(0, 4), tags, notes: String(body.notes ?? "").slice(0, 4000),
  };
  return { data } as const;
}

function ensureContacts(userId: number, companyName: string) {
  if (Contacts.count(userId) > 0) return;
  Contacts.create(userId, { name: companyName, type: "company", company: "", jobTitle: "", email: "", phone: "", city: "", country: "", tags: ["My company"], notes: "Your own company." });
  Contacts.create(userId, { name: "Globex Corporation", type: "company", company: "", jobTitle: "", email: "hello@globex.example", phone: "+1 555 0100", city: "Springfield", country: "US", tags: ["Customer"], notes: "" });
  Contacts.create(userId, { name: "Ali Raza", type: "person", company: "Globex Corporation", jobTitle: "Purchasing manager", email: "ali@globex.example", phone: "+92 300 1234567", city: "Lahore", country: "PK", tags: ["Customer"], notes: "" });
  Contacts.create(userId, { name: "Sara Khan", type: "person", company: "Initech", jobTitle: "CTO", email: "sara@initech.example", phone: "+92 321 7654321", city: "Karachi", country: "PK", tags: ["Prospect"], notes: "" });
  Contacts.create(userId, { name: "Supplier A", type: "company", company: "", jobTitle: "", email: "sales@supplier-a.example", phone: "", city: "Shenzhen", country: "CN", tags: ["Vendor"], notes: "" });
}

system.get("/contacts", (req, res) => {
  const u = currentUser(req);
  ensureContacts(u.id, u.company);
  res.json({ contacts: Contacts.list(u.id).map(toContact) });
});
system.post("/contacts", (req, res) => {
  const u = currentUser(req);
  const c = cleanContact(req.body as Record<string, unknown>);
  if ("error" in c) return res.status(400).json(c);
  res.status(201).json({ contact: toContact(Contacts.create(u.id, c.data)) });
});
system.patch("/contacts/:id", (req, res) => {
  const u = currentUser(req);
  const ex = Contacts.get(Number(req.params.id), u.id);
  if (!ex) return res.status(404).json({ error: "Contact not found" });
  const c = cleanContact({ ...toContact(ex), ...(req.body as Record<string, unknown>) });
  if ("error" in c) return res.status(400).json(c);
  res.json({ contact: toContact(Contacts.update(ex.id, u.id, c.data)!) });
});
system.delete("/contacts/:id", (req, res) => {
  const u = currentUser(req);
  if (!Contacts.delete(Number(req.params.id), u.id)) return res.status(404).json({ error: "Contact not found" });
  res.json({ ok: true });
});
