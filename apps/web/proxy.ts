import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard"];
const AUTH_ONLY_FOR_GUESTS = ["/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("zv_session")?.value);

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (AUTH_ONLY_FOR_GUESTS.includes(pathname) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
