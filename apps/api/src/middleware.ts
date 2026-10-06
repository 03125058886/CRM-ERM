import type { Request, Response, NextFunction } from "express";

/** Tiny in-memory sliding-window rate limiter, keyed by IP + route. */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }
    list.push(now);
    hits.set(key, list);
    if (hits.size > 10_000) hits.clear();
    next();
  };
}
