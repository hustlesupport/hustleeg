import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_SESSION_COOKIE = "hustle_admin_session";
const CUSTOMER_SESSION_COOKIE = "hustle_customer_session";

const ACCOUNT_PUBLIC_PATHS = new Set(["/account/login", "/account/register"]);

async function isValidSession(token: string | undefined) {
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (await isValidSession(token)) return NextResponse.next();
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/account")) {
    if (ACCOUNT_PUBLIC_PATHS.has(pathname)) return NextResponse.next();
    const token = req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (await isValidSession(token)) return NextResponse.next();
    const loginUrl = new URL("/account/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
