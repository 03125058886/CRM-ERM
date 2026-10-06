/* Tables + data access for the system apps: Discuss / Calendar / Contacts. */
import { db } from "./db.js";

db.exec(`
CREATE TABLE IF NOT EXISTS channels (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_bot     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS messages_channel ON messages(channel_id, id);
CREATE TABLE IF NOT EXISTS events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  start     TEXT NOT NULL,
  end       TEXT NOT NULL,
  all_day   INTEGER NOT NULL DEFAULT 0,
  location  TEXT NOT NULL DEFAULT '',
  partner   TEXT NOT NULL DEFAULT '',
  notes     TEXT NOT NULL DEFAULT '',
  color     TEXT NOT NULL DEFAULT '#5B4BFF'
);
CREATE INDEX IF NOT EXISTS events_user_start ON events(user_id, start);
CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'person',
  company    TEXT NOT NULL DEFAULT '',
  job_title  TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  country    TEXT NOT NULL DEFAULT '',
  tags       TEXT NOT NULL DEFAULT '[]',
  notes      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS contacts_user ON contacts(user_id, name);
`);

export interface ChannelRow { id: number; user_id: number; name: string; description: string; created_at: string; last_message_at: string | null; message_count: number }
export interface MessageRow { id: number; channel_id: number; author: string; body: string; is_bot: number; created_at: string }
export interface EventRow { id: number; user_id: number; title: string; start: string; end: string; all_day: number; location: string; partner: string; notes: string; color: string }
export interface ContactRow { id: number; user_id: number; name: string; type: string; company: string; job_title: string; email: string; phone: string; city: string; country: string; tags: string; notes: string; created_at: string }

const q = {
  channels: db.prepare(`SELECT c.*, (SELECT MAX(created_at) FROM messages m WHERE m.channel_id = c.id) AS last_message_at,
    (SELECT COUNT(*) FROM messages m WHERE m.channel_id = c.id) AS message_count FROM channels c WHERE c.user_id = ? ORDER BY c.id`),
  channel: db.prepare("SELECT * FROM channels WHERE id = ? AND user_id = ?"),
  channelCount: db.prepare("SELECT COUNT(*) AS n FROM channels WHERE user_id = ?"),
  insertChannel: db.prepare("INSERT INTO channels (user_id, name, description) VALUES (?,?,?)"),
  messages: db.prepare("SELECT * FROM messages WHERE channel_id = ? ORDER BY id ASC LIMIT 500"),
  insertMessage: db.prepare("INSERT INTO messages (channel_id, author, body, is_bot) VALUES (?,?,?,?)"),
  message: db.prepare("SELECT * FROM messages WHERE id = ?"),

  events: db.prepare("SELECT * FROM events WHERE user_id = ? AND start < ? AND end > ? ORDER BY start"),
  event: db.prepare("SELECT * FROM events WHERE id = ? AND user_id = ?"),
  eventCount: db.prepare("SELECT COUNT(*) AS n FROM events WHERE user_id = ?"),
  insertEvent: db.prepare("INSERT INTO events (user_id, title, start, end, all_day, location, partner, notes, color) VALUES (?,?,?,?,?,?,?,?,?)"),
  updateEvent: db.prepare("UPDATE events SET title=?, start=?, end=?, all_day=?, location=?, partner=?, notes=?, color=? WHERE id = ? AND user_id = ?"),
  deleteEvent: db.prepare("DELETE FROM events WHERE id = ? AND user_id = ?"),

  contacts: db.prepare("SELECT * FROM contacts WHERE user_id = ? ORDER BY name COLLATE NOCASE"),
  contact: db.prepare("SELECT * FROM contacts WHERE id = ? AND user_id = ?"),
  contactCount: db.prepare("SELECT COUNT(*) AS n FROM contacts WHERE user_id = ?"),
  insertContact: db.prepare("INSERT INTO contacts (user_id, name, type, company, job_title, email, phone, city, country, tags, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)"),
  updateContact: db.prepare("UPDATE contacts SET name=?, type=?, company=?, job_title=?, email=?, phone=?, city=?, country=?, tags=?, notes=? WHERE id = ? AND user_id = ?"),
  deleteContact: db.prepare("DELETE FROM contacts WHERE id = ? AND user_id = ?"),
};

export const Discuss = {
  channels: (userId: number) => q.channels.all(userId) as unknown as ChannelRow[],
  channel: (id: number, userId: number) => q.channel.get(id, userId) as ChannelRow | undefined,
  channelCount: (userId: number) => Number((q.channelCount.get(userId) as { n: number }).n),
  createChannel: (userId: number, name: string, description: string) => Number(q.insertChannel.run(userId, name, description).lastInsertRowid),
  messages: (channelId: number) => q.messages.all(channelId) as unknown as MessageRow[],
  post(channelId: number, author: string, body: string, isBot = false): MessageRow {
    const r = q.insertMessage.run(channelId, author, body, isBot ? 1 : 0);
    return q.message.get(Number(r.lastInsertRowid)) as unknown as MessageRow;
  },
};

export type EventData = { title: string; start: string; end: string; allDay: boolean; location: string; partner: string; notes: string; color: string };
export const Events = {
  range: (userId: number, from: string, to: string) => q.events.all(userId, to, from) as unknown as EventRow[],
  get: (id: number, userId: number) => q.event.get(id, userId) as EventRow | undefined,
  count: (userId: number) => Number((q.eventCount.get(userId) as { n: number }).n),
  create(userId: number, d: EventData): EventRow {
    const r = q.insertEvent.run(userId, d.title, d.start, d.end, d.allDay ? 1 : 0, d.location, d.partner, d.notes, d.color);
    return Events.get(Number(r.lastInsertRowid), userId)!;
  },
  update(id: number, userId: number, d: EventData) {
    q.updateEvent.run(d.title, d.start, d.end, d.allDay ? 1 : 0, d.location, d.partner, d.notes, d.color, id, userId);
    return Events.get(id, userId);
  },
  delete: (id: number, userId: number) => q.deleteEvent.run(id, userId).changes > 0,
};

export type ContactData = { name: string; type: string; company: string; jobTitle: string; email: string; phone: string; city: string; country: string; tags: string[]; notes: string };
export const Contacts = {
  list: (userId: number) => q.contacts.all(userId) as unknown as ContactRow[],
  get: (id: number, userId: number) => q.contact.get(id, userId) as ContactRow | undefined,
  count: (userId: number) => Number((q.contactCount.get(userId) as { n: number }).n),
  create(userId: number, d: ContactData): ContactRow {
    const r = q.insertContact.run(userId, d.name, d.type, d.company, d.jobTitle, d.email, d.phone, d.city, d.country, JSON.stringify(d.tags), d.notes);
    return Contacts.get(Number(r.lastInsertRowid), userId)!;
  },
  update(id: number, userId: number, d: ContactData) {
    q.updateContact.run(d.name, d.type, d.company, d.jobTitle, d.email, d.phone, d.city, d.country, JSON.stringify(d.tags), d.notes, id, userId);
    return Contacts.get(id, userId);
  },
  delete: (id: number, userId: number) => q.deleteContact.run(id, userId).changes > 0,
};
