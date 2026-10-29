import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight JWT parser that works in Next.js Edge Middleware without Node libraries
function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect routes under /admin (including /admin/*)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow the login page without a token
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Retrieve session cookie
  const token = request.cookies.get("cv_hub_session")?.value;
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(token);
  if (!payload || !payload.role) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check expiration if present
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce admin role
  if (payload.role !== "admin") {
    return new NextResponse("Forbidden: Admin access required", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
