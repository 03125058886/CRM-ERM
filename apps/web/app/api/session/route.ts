import { NextResponse } from "next/server";

/** DELETE /api/session — sign out (clears the httpOnly cookie). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("nx_session", "", { path: "/", maxAge: 0 });
  return res;
}
