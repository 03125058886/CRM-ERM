import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Same-origin proxy to the Zuvora API.
 * - Forwards the httpOnly session cookie as a Bearer token.
 * - When the API answers with { token }, stores it in an httpOnly cookie so the
 *   browser never touches the raw JWT.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const COOKIE = "zv_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  if (fwd) headers["x-forwarded-for"] = fwd;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "API is unreachable. Is the API server running?" }, { status: 502 });
  }

  const text = await upstream.text();
  let data: Record<string, unknown> = {};
  try { data = text ? (JSON.parse(text) as Record<string, unknown>) : {}; } catch { data = { error: text }; }

  let setToken: string | null = null;
  if (typeof data.token === "string") {
    setToken = data.token;
    delete data.token; // never expose the raw JWT to the browser
  }

  const res = NextResponse.json(data, { status: upstream.status });
  const cc = upstream.headers.get("cache-control");
  if (cc) res.headers.set("cache-control", cc);

  if (setToken) {
    res.cookies.set(COOKIE, setToken, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: COOKIE_MAX_AGE,
    });
  } else if (upstream.status === 401 && token) {
    res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
