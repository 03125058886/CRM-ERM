import { Router } from "express";
import { isValidAppId, moduleFor, type RecordRow, type RecordNote } from "@nexora/shared";
import { Records, type RecordDbRow } from "./db.js";
import { requireAuth, currentUser } from "./auth.js";
import { stagesFor, saveStages, Notes, type NoteRow } from "./workdb.js";

export const records = Router();
records.use(requireAuth);

function toRecord(r: RecordDbRow): RecordRow {
  return { id: r.id, appId: r.app_id, title: r.title, stage: r.stage, amount: r.amount, partner: r.partner, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at };
}
function toNote(n: NoteRow): RecordNote & { recordTitle?: string } {
  return { id: n.id, recordId: n.record_id, kind: n.kind === "log" ? "log" : "note", author: n.author, body: n.body, createdAt: n.created_at, recordTitle: n.record_title };
}
const fullName = (u: { first_name: string; last_name: string }) => `${u.first_name} ${u.last_name}`.trim();

function clean(stages: string[], body: Record<string, unknown>, fallbackStage?: string) {
  const title = String(body.title ?? "").trim();
  if (!title) return { error: "Title is required", field: "title" } as const;
  if (title.length > 200) return { error: "Title is too long", field: "title" } as const;
  const stage = typeof body.stage === "string" && stages.includes(body.stage) ? body.stage : (fallbackStage && stages.includes(fallbackStage) ? fallbackStage : stages[0]);
  let amount: number | null = null;
  if (body.amount !== undefined && body.amount !== null && body.amount !== "") {
    const n = Number(body.amount);
    if (!Number.isFinite(n)) return { error: "Amount must be a number", field: "amount" } as const;
    amount = n;
  }
  const partner = String(body.partner ?? "").trim().slice(0, 120);
  const notes = String(body.notes ?? "").trim().slice(0, 4000);
  return { data: { title, stage, amount, partner, notes } } as const;
}

/** Seed demo data the first time a workspace is touched. */
export function ensureSeeded(userId: number, appId: string) {
  if (Records.count(userId, appId) > 0) return;
  for (const s of moduleFor(appId).seed) {
    const r = Records.create(userId, appId, { title: s.title, stage: s.stage, amount: s.amount ?? null, partner: s.partner ?? "", notes: s.notes ?? "" });
    Notes.add(r.id, "log", "Nexora", `${moduleFor(appId).noun} created (demo data)`);
  }
}

function guardApp(req: Parameters<typeof currentUser>[0], appId: string) {
  if (!isValidAppId(appId)) return { status: 404, error: "Unknown app" };
  const u = currentUser(req);
  if (!u.verified) return { status: 403, error: "Verify your account first." };
  const userApps = JSON.parse(u.apps) as string[];
  if (!userApps.includes(appId)) return { status: 403, error: "This app is not installed in your workspace.", code: "not_installed" };
  return null;
}

/** GET /apps/:appId/records — module (with effective stages) + all records. */
records.get("/apps/:appId/records", (req, res) => {
  const appId = String(req.params.appId);
  const g = guardApp(req, appId);
  if (g) return res.status(g.status).json(g);
  const u = currentUser(req);
  ensureSeeded(u.id, appId);
  res.json({ module: { ...moduleFor(appId), stages: stagesFor(u.id, appId) }, records: Records.list(u.id, appId).map(toRecord) });
});

records.post("/apps/:appId/records", (req, res) => {
  const appId = String(req.params.appId);
  const g = guardApp(req, appId);
  if (g) return res.status(g.status).json(g);
  const u = currentUser(req);
  const c = clean(stagesFor(u.id, appId), req.body as Record<string, unknown>);
  if ("error" in c) return res.status(400).json(c);
  const r = Records.create(u.id, appId, c.data);
  Notes.add(r.id, "log", fullName(u), `${moduleFor(appId).noun} created in stage "${r.stage}"`);
  res.status(201).json({ record: toRecord(r) });
});

/** GET /records/:id — one record with its chatter. */
records.get("/records/:id", (req, res) => {
  const u = currentUser(req);
  const r = Records.get(Number(req.params.id), u.id);
  if (!r) return res.status(404).json({ error: "Record not found" });
  res.json({ record: toRecord(r), module: { ...moduleFor(r.app_id), stages: stagesFor(u.id, r.app_id) }, notes: Notes.list(r.id).map(toNote) });
});

records.patch("/records/:id", (req, res) => {
  const u = currentUser(req);
  const existing = Records.get(Number(req.params.id), u.id);
  if (!existing) return res.status(404).json({ error: "Record not found" });
  const body = req.body as Record<string, unknown>;
  const merged = { title: existing.title, stage: existing.stage, amount: existing.amount, partner: existing.partner, notes: existing.notes, ...body };
  const c = clean(stagesFor(u.id, existing.app_id), merged, existing.stage);
  if ("error" in c) return res.status(400).json(c);
  const updated = Records.update(existing.id, u.id, c.data)!;
  const who = fullName(u);
  const changes: string[] = [];
  if (existing.stage !== updated.stage) changes.push(`Stage: ${existing.stage} → ${updated.stage}`);
  if (existing.title !== updated.title) changes.push(`Title: "${existing.title}" → "${updated.title}"`);
  if ((existing.amount ?? null) !== (updated.amount ?? null)) changes.push(`${moduleFor(existing.app_id).amountLabel ?? "Amount"}: ${existing.amount ?? "–"} → ${updated.amount ?? "–"}`);
  if (existing.partner !== updated.partner) changes.push(`${moduleFor(existing.app_id).partnerLabel ?? "Partner"}: ${existing.partner || "–"} → ${updated.partner || "–"}`);
  if (changes.length) Notes.add(updated.id, "log", who, changes.join("\n"));
  res.json({ record: toRecord(updated), notes: Notes.list(updated.id).map(toNote) });
});

records.delete("/records/:id", (req, res) => {
  const u = currentUser(req);
  if (!Records.delete(Number(req.params.id), u.id)) return res.status(404).json({ error: "Record not found" });
  res.json({ ok: true });
});

/* ---------- chatter ---------- */
records.post("/records/:id/notes", (req, res) => {
  const u = currentUser(req);
  const r = Records.get(Number(req.params.id), u.id);
  if (!r) return res.status(404).json({ error: "Record not found" });
  const body = String((req.body as { body?: string }).body ?? "").trim().slice(0, 4000);
  if (!body) return res.status(400).json({ error: "Note cannot be empty", field: "body" });
  res.status(201).json({ note: toNote(Notes.add(r.id, "note", fullName(u), body)) });
});

/** GET /apps/:appId/activity — recent chatter across the app (Reporting → Activity). */
records.get("/apps/:appId/activity", (req, res) => {
  const appId = String(req.params.appId);
  const g = guardApp(req, appId);
  if (g) return res.status(g.status).json(g);
  res.json({ activity: Notes.recent(currentUser(req).id, appId).map(toNote) });
});

/* ---------- configuration: stages ---------- */
records.get("/apps/:appId/stages", (req, res) => {
  const appId = String(req.params.appId);
  const g = guardApp(req, appId);
  if (g) return res.status(g.status).json(g);
  res.json({ stages: stagesFor(currentUser(req).id, appId), defaults: moduleFor(appId).stages });
});

records.put("/apps/:appId/stages", (req, res) => {
  const appId = String(req.params.appId);
  const g = guardApp(req, appId);
  if (g) return res.status(g.status).json(g);
  const u = currentUser(req);
  const body = req.body as { stages?: unknown; renames?: unknown };
  const stages = Array.isArray(body.stages) ? body.stages.map((s) => String(s).trim().slice(0, 40)).filter(Boolean) : [];
  if (stages.length < 2) return res.status(400).json({ error: "Keep at least two stages." });
  if (new Set(stages).size !== stages.length) return res.status(400).json({ error: "Stage names must be unique." });
  const renames: Record<string, string> = {};
  if (body.renames && typeof body.renames === "object") {
    for (const [k, v] of Object.entries(body.renames as Record<string, unknown>)) if (typeof v === "string" && stages.includes(v)) renames[k] = v;
  }
  saveStages(u.id, appId, stages, renames);
  // Records left in a removed stage fall back to the first stage.
  for (const r of Records.list(u.id, appId)) {
    if (!stages.includes(r.stage)) { Records.update(r.id, u.id, { title: r.title, stage: stages[0], amount: r.amount, partner: r.partner, notes: r.notes }); Notes.add(r.id, "log", fullName(u), `Stage "${r.stage}" was removed → moved to "${stages[0]}"`); }
  }
  res.json({ stages });
});
