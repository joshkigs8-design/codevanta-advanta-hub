import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { getReferralCodeForUser, attributeReferral } from "@/lib/referral";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, displayName, referralCode, emailVerified } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = displayName?.trim() || cleanEmail.split("@")[0];
    const isEmailVerified = Boolean(emailVerified);
    const db = getDb();

    // Check if user exists in local database
    let profile = db
      .prepare("SELECT * FROM profiles WHERE email = ?")
      .get(cleanEmail) as {
        id: string;
        email: string;
        role: "user" | "member" | "admin";
        full_name: string;
        email_verified?: number;
      } | undefined;

    const adminEmails = [
      "joshkigs8@gmail.com",
      (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim(),
    ].filter(Boolean);
    const isAdminEmail = adminEmails.includes(cleanEmail);
    const now = new Date().toISOString();

    if (profile) {
      if (isAdminEmail && profile.role !== "admin") {
        db.prepare("UPDATE profiles SET role = 'admin' WHERE id = ?").run(profile.id);
        profile.role = "admin";
      }
      if (isEmailVerified && !profile.email_verified) {
        db.prepare("UPDATE profiles SET email_verified = 1, updated_at = ? WHERE id = ?").run(now, profile.id);
        profile.email_verified = 1;
      }
    }

    if (!profile) {
      // First-time registration / sign-in
      const role = isAdminEmail ? "admin" : "user";
      const id = uid || crypto.randomUUID();

      db.prepare(`
        INSERT INTO profiles (id, email, password_hash, full_name, avatar_url, role, phone_number, country, email_verified, created_at, updated_at)
        VALUES (?, ?, 'FIREBASE_AUTH', ?, NULL, ?, NULL, 'KE', ?, ?, ?)
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
      const effectiveRef = referralCode?.trim() || req.cookies.get("cv_ref_code")?.value?.trim();
      if (effectiveRef && role !== "admin") {
        const rawIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const ua = req.headers.get("user-agent") || "unknown";
        const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex");
        const uaHash = crypto.createHash("sha256").update(ua).digest("hex");
        attributeReferral(effectiveRef, id, ipHash, uaHash);
      }
    }

    // Sign session token
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

    response.cookies.set("cv_hub_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Firebase session sync error:", err);
    return NextResponse.json({ error: "Failed to establish session." }, { status: 500 });
  }
}
