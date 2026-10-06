/* Per-app configuration (custom stages) and record chatter notes. */
import { moduleFor } from "@zuvora/shared";
import { db } from "./db.js";

db.exec(`
CREATE TABLE IF NOT EXISTS app_stages (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id  TEXT NOT NULL,
  stages  TEXT NOT NULL,
  PRIMARY KEY (user_id, app_id)
);
CREATE TABLE IF NOT EXISTS record_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id  INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'note',
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS record_notes_record ON record_notes(record_id, id);
`);

const q = {
  getStages: db.prepare("SELECT stages FROM app_stages WHERE user_id = ? AND app_id = ?"),
  setStages: db.prepare("INSERT INTO app_stages (user_id, app_id, stages) VALUES (?,?,?) ON CONFLICT(user_id, app_id) DO UPDATE SET stages = excluded.stages"),
  renameStage: db.prepare("UPDATE records SET stage = ? WHERE user_id = ? AND app_id = ? AND stage = ?"),
  notes: db.prepare("SELECT * FROM record_notes WHERE record_id = ? ORDER BY id ASC"),
  insertNote: db.prepare("INSERT INTO record_notes (record_id, kind, author, body) VALUES (?,?,?,?)"),
  note: db.prepare("SELECT * FROM record_notes WHERE id = ?"),
  recent: db.prepare(`SELECT n.*, r.title AS record_title FROM record_notes n JOIN records r ON r.id = n.record_id
    WHERE r.user_id = ? AND r.app_id = ? ORDER BY n.id DESC LIMIT 50`),
};

/** Effective pipeline stages for this user + app (custom if saved, else the module default). */
export function stagesFor(userId: number, appId: string): string[] {
  const row = q.getStages.get(userId, appId) as { stages: string } | undefined;
  if (row) {
    try { const s = JSON.parse(row.stages) as string[]; if (Array.isArray(s) && s.length) return s; } catch {}
  }
  return moduleFor(appId).stages;
}

/** Save stages. `renames` maps old → new so existing records follow a renamed stage. */
export function saveStages(userId: number, appId: string, stages: string[], renames: Record<string, string>) {
  for (const [from, to] of Object.entries(renames)) if (from !== to) q.renameStage.run(to, userId, appId, from);
  q.setStages.run(userId, appId, JSON.stringify(stages));
}

export interface NoteRow { id: number; record_id: number; kind: string; author: string; body: string; created_at: string; record_title?: string }

export const Notes = {
  list: (recordId: number) => q.notes.all(recordId) as unknown as NoteRow[],
  add(recordId: number, kind: "note" | "log", author: string, body: string): NoteRow {
    const r = q.insertNote.run(recordId, kind, author, body);
    return q.note.get(Number(r.lastInsertRowid)) as unknown as NoteRow;
  },
  recent: (userId: number, appId: string) => q.recent.all(userId, appId) as unknown as NoteRow[],
};
