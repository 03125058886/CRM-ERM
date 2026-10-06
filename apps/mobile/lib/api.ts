import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const TOKEN_KEY = "nx_session";

/** Resolve the API base URL: env → Expo dev host (LAN IP) → localhost. */
function resolveBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host && Platform.OS !== "web") return `http://${host}:4000`;
  return "http://localhost:4000";
}
export const BASE_URL = resolveBaseUrl();

export const tokenStore = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string) {
    if (Platform.OS === "web") { try { localStorage.setItem(TOKEN_KEY, token); } catch {} return; }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear() {
    if (Platform.OS === "web") { try { localStorage.removeItem(TOKEN_KEY); } catch {} return; }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  field?: string;
  constructor(message: string, status: number, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown; auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init?.auth !== false) {
    const token = await tokenStore.get();
    if (token) headers.authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init?.method ?? (init?.body ? "POST" : "GET"),
      headers,
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(`Cannot reach the server at ${BASE_URL}. Is the API running?`, 0);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError((data.error as string) ?? `Request failed (${res.status})`, res.status, data.field as string | undefined);
  return data as T;
}
