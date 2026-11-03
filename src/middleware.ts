import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Base64URL decode helper for Edge runtime
function base64UrlToUint8(str: string): Uint8Array {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Blacklist SHA-256 hashes of historically compromised or default secrets
const COMPROMISED_SECRET_HASHES = [
  "a220b2d4a1a8c886f7c353017c99a9ffa895dccbcb9c0a6a06574bc4a9d9b373",
  "2b7219e36912f4e3ca7b4fd52fa12b96f93abe0b9461f9778499df1c6ca11fd6",
];

async function isCompromisedSecretInEdge(secret: string): Promise<boolean> {
  const data = new TextEncoder().encode(secret) as unknown as BufferSource;
  const digestBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(digestBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return COMPROMISED_SECRET_HASHES.includes(hashHex);
}

interface ValidatedSession {
  userId: string;
  email: string;
  role: string;
  fullName?: string;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Authoritatively verifies JWT signature and claims using Web Crypto API.
 * Runs in Edge Middleware with zero external dependencies.
 */
async function verifyJwtInEdge(token: string): Promise<ValidatedSession | null> {
  try {
    const secret = process.env.JWT_SECRET;
    // Fail securely if secret is missing, too weak, or using the known compromised fallback
    if (!secret || (await isCompromisedSecretInEdge(secret)) || secret.length < 32) {
      console.error("[Middleware Security] Insecure or missing JWT_SECRET in environment.");
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;

    // Validate header algorithm
    const headerJson = new TextDecoder().decode(base64UrlToUint8(headerB64));
    const header = JSON.parse(headerJson);
    if (header.alg !== "HS256") {
      return null;
    }

    // Cryptographic signature verification using Web Crypto API
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret) as unknown as BufferSource,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8(sigB64) as unknown as BufferSource;
    const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`) as unknown as BufferSource;
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!isValid) {
      return null;
    }

    const payloadJson = new TextDecoder().decode(base64UrlToUint8(payloadB64));
    const payload = JSON.parse(payloadJson) as ValidatedSession;

    // Validate claims
    if (payload.iss !== "codevanta-hub" || payload.aud !== "codevanta-app") {
      return null;
    }

    // Validate expiration
    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  // Only protect routes under /admin or /api/admin
  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  // Allow the login page without a token
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Retrieve session cookie
  const token = request.cookies.get("cv_hub_session")?.value;
  if (!token) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized: Missing session token" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyJwtInEdge(token);
  if (!payload) {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired session token" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce admin role
  if (payload.role !== "admin") {
    if (isAdminApiRoute) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }
    return new NextResponse("Forbidden: Admin access required", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
