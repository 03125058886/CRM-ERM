import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@zuvora/shared";
import { api, tokenStore } from "./api";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, ready: false, signIn: async () => {}, signOut: async () => {}, setUser: () => {}, refresh: async () => {},
});
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const token = await tokenStore.get();
    if (!token) { setUser(null); return; }
    try {
      const r = await api<{ user: User }>("/auth/me");
      setUser(r.user);
    } catch (e) {
      if ((e as { status?: number }).status === 401) { await tokenStore.clear(); setUser(null); }
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const signIn = useCallback(async (token: string, u: User) => {
    await tokenStore.set(token);
    setUser(u);
  }, []);
  const signOut = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut, setUser, refresh }), [user, ready, signIn, signOut, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ---- in-memory pending verification (survives navigation within the session) ---- */
export interface Pending {
  pendingId: string;
  channel: string;
  maskedPhone?: string;
  maskedEmail?: string;
  devCode?: string;
  purpose: "verify" | "reset";
}
let pending: Pending | null = null;
export const pendingStore = {
  get: () => pending,
  set: (p: Pending) => { pending = p; },
  clear: () => { pending = null; },
};

/* ---- selected apps during onboarding ---- */
let selection: string[] = [];
export const selectionStore = {
  get: () => selection,
  set: (s: string[]) => { selection = s; },
  clear: () => { selection = []; },
};
