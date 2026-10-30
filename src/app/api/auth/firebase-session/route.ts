import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { getReferralCodeForUser, attributeReferral } from "@/lib/referral";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, displayName, referralCode } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = displayName?.trim() || cleanEmail.split("@")[0];
    const db = getDb();

    // Check if user exists in local database
    let profile = db
      .prepare("SELECT * FROM profiles WHERE email = ?")
      .get(cleanEmail) as {
        id: string;
        email: string;
        role: "user" | "member" | "admin";
        full_name: string;
      } | undefined;

    const adminEmails = [
      "joshkigs8@gmail.com",
      (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim(),
    ].filter(Boolean);
    const isAdminEmail = adminEmails.includes(cleanEmail);
    const now = new Date().toISOString();

    if (profile && isAdminEmail && profile.role !== "admin") {
      db.prepare("UPDATE profiles SET role = 'admin' WHERE id = ?").run(profile.id);
      profile.role = "admin";
    }

    if (!profile) {
      // First-time registration / sign-in
      const role = isAdminEmail ? "admin" : "user";
      const id = uid || crypto.randomUUID();

      db.prepare(`
        INSERT INTO profiles (id, email, password_hash, full_name, avatar_url, role, phone_number, country, created_at, updated_at)
        VALUES (?, ?, 'FIREBASE_AUTH', ?, NULL, ?, NULL, 'KE', ?, ?)
      `).run(id, cleanEmail, cleanName, role, now, now);

      profile = {
        id,
        email: cleanEmail,
        role,
        full_name: cleanName,
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
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

