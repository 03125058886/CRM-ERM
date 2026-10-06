import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@nexora/shared";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** Server-side: fetch the signed-in user once per request (deduped via React cache). */
export const getUser = cache(async (): Promise<User> => {
  const token = (await cookies()).get("nx_session")?.value;
  if (!token) redirect("/login");
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/me`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  } catch {
    throw new Error("API unreachable");
  }
  if (res.status === 401) redirect("/login?expired=1");
  if (!res.ok) throw new Error("Failed to load user");
  const data = (await res.json()) as { user: User };
  return data.user;
});
