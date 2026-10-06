import { Router } from "express";
import { isValidAppId, moduleFor, type RecordRow } from "@nexora/shared";
import { Records, type RecordDbRow } from "./db.js";
import { requireAuth, currentUser } from "./auth.js";

export const records = Router();
records.use(requireAuth);

function toRecord(r: RecordDbRow): RecordRow {
  return { id: r.id, appId: r.app_id, title: r.title, stage: r.stage, amount: r.amount, partner: r.partner, notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at };
}

function clean(appId: string, body: Record<string, unknown>, fallbackStage?: string) {
  const mod = moduleFor(appId);
  const title = String(body.title ?? "").trim();
  if (!title) return { error: "Title is required", field: "title" } as const;
  if (title.length > 200) return { error: "Title is too long", field: "title" } as const;
  const stage = typeof body.stage === "string" && mod.stages.includes(body.stage) ? body.stage : (fallbackStage ?? mod.stages[0]);
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
    Records.create(userId, appId, { title: s.title, stage: s.stage, amount: s.amount ?? null, partner: s.partner ?? "", notes: s.notes ?? "" });
  }
}

/** GET /apps/:appId/records — seeds demo data on first visit so the workspace is not empty. */
records.get("/apps/:appId/records", (req, res) => {
  const appId = String(req.params.appId);
  if (!isValidAppId(appId)) return res.status(404).json({ error: "Unknown app" });
  const u = currentUser(req);
  if (!u.verified) return res.status(403).json({ error: "Verify your account first." });
  const userApps = JSON.parse(u.apps) as string[];
  if (!userApps.includes(appId)) return res.status(403).json({ error: "This app is not installed in your workspace.", code: "not_installed" });

  ensureSeeded(u.id, appId);
  res.json({ module: moduleFor(appId), records: Records.list(u.id, appId).map(toRecord) });
});

records.post("/apps/:appId/records", (req, res) => {
  const appId = String(req.params.appId);
  if (!isValidAppId(appId)) return res.status(404).json({ error: "Unknown app" });
  const u = currentUser(req);
  const c = clean(appId, req.body as Record<string, unknown>);
  if ("error" in c) return res.status(400).json(c);
  res.status(201).json({ record: toRecord(Records.create(u.id, appId, c.data)) });
});

records.patch("/records/:id", (req, res) => {
  const u = currentUser(req);
  const existing = Records.get(Number(req.params.id), u.id);
  if (!existing) return res.status(404).json({ error: "Record not found" });
  const body = req.body as Record<string, unknown>;
  const merged = { title: existing.title, stage: existing.stage, amount: existing.amount, partner: existing.partner, notes: existing.notes, ...body };
  const c = clean(existing.app_id, merged, existing.stage);
  if ("error" in c) return res.status(400).json(c);
  res.json({ record: toRecord(Records.update(existing.id, u.id, c.data)!) });
});

records.delete("/records/:id", (req, res) => {
  const u = currentUser(req);
  if (!Records.delete(Number(req.params.id), u.id)) return res.status(404).json({ error: "Record not found" });
  res.json({ ok: true });
});
