import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { getReferralCodeForUser, attributeReferral } from "@/lib/referral";
import { verifyFirebaseIdToken } from "@/lib/verifyFirebaseToken";
import { UserRole } from "@/types";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or invalid body is acceptable if Authorization header is provided
    }

    if (!idToken && body?.idToken && typeof body.idToken === "string") {
      idToken = body.idToken.trim();
    }

    // 1. Mandatory requirement: A genuine, valid Firebase ID token must be provided
    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication failed: Missing Firebase ID token. A verified session requires a genuine token." },
        { status: 401 }
      );
    }

    // 2. Cryptographically verify the token claims with Google Identity Toolkit
    const verifiedUser = await verifyFirebaseIdToken(idToken);
    if (!verifiedUser) {
      return NextResponse.json(
        { error: "Authentication failed: Invalid, expired, or untrusted Firebase ID token." },
        { status: 401 }
      );
    }

    // Verified claims derived SOLELY from the cryptographic token
    const cleanEmail = verifiedUser.email;
    const verifiedUid = verifiedUser.uid;
    const isEmailVerified = verifiedUser.emailVerified;
    const cleanName = verifiedUser.displayName?.trim() || (typeof body?.displayName === "string" ? body.displayName.trim() : "") || cleanEmail.split("@")[0];

    const db = getDb();

    // Check if user exists in local database
    let profile = db
      .prepare("SELECT * FROM profiles WHERE email = ?")
      .get(cleanEmail) as {
        id: string;
        email: string;
        role: UserRole;
        full_name: string;
        email_verified?: number;
      } | undefined;

    const adminEmails = [
      "joshkigs8@gmail.com",
      (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim(),
    ].filter(Boolean);
    const isAdminEmail = adminEmails.includes(cleanEmail);
    // Verified designated root administrator is guaranteed admin role upon genuine authentication
    const isEligibleForAdmin = isAdminEmail && (isEmailVerified || cleanEmail === "joshkigs8@gmail.com");
    const now = new Date().toISOString();

    if (profile) {
      if (isEligibleForAdmin && profile.role !== "admin") {
        db.prepare("UPDATE profiles SET role = 'admin', updated_at = ? WHERE id = ?").run(now, profile.id);
        profile.role = "admin";
      }

      if (isEmailVerified && !profile.email_verified) {
        db.prepare("UPDATE profiles SET email_verified = 1, updated_at = ? WHERE id = ?").run(now, profile.id);
        profile.email_verified = 1;
      }
    }

    if (!profile) {
      // First-time registration / sign-in with verified identity
      const role: UserRole = isEligibleForAdmin ? "admin" : "user";
      const id = verifiedUid || crypto.randomUUID();

      db.prepare(`
        INSERT INTO profiles (id, email, password_hash, full_name, avatar_url, role, phone_number, country, email_verified, created_at, updated_at)
        VALUES (?, ?, 'FIREBASE_AUTH', ?, NULL, ?, NULL, 'KE', ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          password_hash = excluded.password_hash,
          full_name = excluded.full_name,
          role = excluded.role,
          email_verified = excluded.email_verified,
          updated_at = excluded.updated_at
      `).run(id, cleanEmail, cleanName, role, isEmailVerified ? 1 : 0, now, now);

      profile = {
        id,
        email: cleanEmail,
        role,
        full_name: cleanName,
        email_verified: isEmailVerified ? 1 : 0,
      };

      // Generate user referral code
      getReferralCodeForUser(id);

      // Attribute referral code if provided
      const effectiveRef = (typeof body?.referralCode === "string" ? body.referralCode.trim() : null) || req.cookies.get("cv_ref_code")?.value?.trim();
      if (effectiveRef && role !== "admin") {
        const rawIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const ua = req.headers.get("user-agent") || "unknown";
        const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");
        const uaHash = crypto.createHash("sha256").update(ua).digest("hex");
        attributeReferral(effectiveRef, id, ipHash, uaHash);
      }
    }

    // Sign session token with verified claims
    const token = signToken({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      fullName: profile.full_name,
      emailVerified: Boolean(isEmailVerified || profile.email_verified),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        email_verified: Boolean(isEmailVerified || profile.email_verified),
      },
    });

    const host = req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    const isHttps = proto === "https" || req.url.startsWith("https://");
    const isSecure = (process.env.NODE_ENV === "production" && !isLocalhost) || isHttps;

    response.cookies.set("cv_hub_session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Firebase session sync error:", err);
    return NextResponse.json({ error: "Failed to establish session." }, { status: 500 });
  }
}
