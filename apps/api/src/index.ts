import express from "express";
import cors from "cors";
import { CATALOG, COUNTRIES, LANGUAGES, COMPANY_SIZES, INTERESTS, BRAND } from "@nexora/shared";
import { auth } from "./auth.js";
import { records } from "./records.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => res.json({ ok: true, name: BRAND.name, time: new Date().toISOString() }));

// Static catalog / metadata. Cacheable for a day.
app.get("/catalog", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.json({ catalog: CATALOG });
});
app.get("/meta", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.json({ countries: COUNTRIES, languages: LANGUAGES, companySizes: COMPANY_SIZES, interests: INTERESTS, brand: BRAND });
});

app.use("/auth", auth);
app.use("/", records);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: Error & { status?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body." });
  console.error(err);
  res.status(err.status ?? 500).json({ error: "Something went wrong." });
});

app.listen(PORT, () => {
  console.log(`\n  ${BRAND.name} API  →  http://localhost:${PORT}   (${process.env.NODE_ENV ?? "development"})\n`);
});
