"use client";

export class ApiError extends Error {
  status: number;
  field?: string;
  errors?: Record<string, string>;
  constructor(message: string, status: number, field?: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.field = field;
    this.errors = errors;
  }
}

/** Browser-side client. Always goes through the same-origin proxy (httpOnly cookie auth). */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: { "content-type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      (data.error as string) ?? `Request failed (${res.status})`,
      res.status,
      data.field as string | undefined,
      data.errors as Record<string, string> | undefined,
    );
  }
  return data as T;
}

export async function signOut() {
  await fetch("/api/session", { method: "DELETE" });
}

/* ---- pending verification helpers (survives refresh, cleared on success) ---- */
export interface Pending {
  pendingId: string;
  channel: string;
  maskedPhone?: string;
  maskedEmail?: string;
  expiresIn: number;
  devCode?: string;
  purpose: "verify" | "reset";
  email?: string;
}
const PENDING_KEY = "zuvora.pending";
export const pendingStore = {
  get(): Pending | null {
    try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) ?? "null"); } catch { return null; }
  },
  set(p: Pending) { try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch {} },
  clear() { try { sessionStorage.removeItem(PENDING_KEY); } catch {} },
};

const APPS_KEY = "zuvora.selectedApps";
export const selectionStore = {
  get(): string[] {
    try { return JSON.parse(localStorage.getItem(APPS_KEY) ?? "[]"); } catch { return []; }
  },
  set(apps: string[]) { try { localStorage.setItem(APPS_KEY, JSON.stringify(apps)); } catch {} },
  clear() { try { localStorage.removeItem(APPS_KEY); } catch {} },
};
