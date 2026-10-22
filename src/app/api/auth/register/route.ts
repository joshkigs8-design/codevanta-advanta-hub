import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { attributeReferral, getReferralCodeForUser } from "@/lib/referral";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, referralCode } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Email, password, and full name are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM profiles WHERE email = ?").get(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, avatar_url, role, phone_number, country, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'user', NULL, 'KE', ?, ?)
    `).run(userId, email.toLowerCase().trim(), passwordHash, full_name.trim(), null, now, now);

    // Initialize user referral code
    getReferralCodeForUser(userId);

    // Check & attribute referral code if provided
    if (referralCode && typeof referralCode === "string") {
      const ip = req.headers.get("x-forwarded-for") || "unknown";
      const ua = req.headers.get("user-agent") || "unknown";
      const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
      const uaHash = crypto.createHash("sha256").update(ua).digest("hex");
      attributeReferral(referralCode, userId, ipHash, uaHash);
    }

    const token = signToken({
      userId,
      email: email.toLowerCase().trim(),
      role: "user",
      fullName: full_name.trim(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        role: "user",
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
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
