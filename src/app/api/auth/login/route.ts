import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb();
    let profile = db
      .prepare("SELECT * FROM profiles WHERE email = ?")
      .get(cleanEmail) as {
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: "user" | "member" | "admin";
      } | undefined;

    let passwordValid = false;
    if (profile && profile.password_hash && profile.password_hash !== "FIREBASE_AUTH") {
      try {
        passwordValid = bcrypt.compareSync(password, profile.password_hash);
      } catch {
        passwordValid = false;
      }
    }

    // If local comparison fails or user account is managed by Firebase Auth, verify via Firebase Auth REST API
    if (!passwordValid) {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (apiKey) {
        try {
          const fbRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: cleanEmail,
                password,
                returnSecureToken: true,
              }),
            }
          );
          const fbData = await fbRes.json();
          if (fbData && fbData.idToken && fbData.localId) {
            passwordValid = true;
            const isAdmin = cleanEmail === "joshkigs8@gmail.com" || cleanEmail === (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim();
            const targetRole = isAdmin ? "admin" : (profile?.role || "user");
            const now = new Date().toISOString();

            if (!profile) {
              const newId = fbData.localId;
              const fullName = fbData.displayName || cleanEmail.split("@")[0];
              db.prepare(`
                INSERT INTO profiles (id, email, password_hash, full_name, role, country, email_verified, created_at, updated_at)
                VALUES (?, ?, 'FIREBASE_AUTH', ?, ?, 'KE', 1, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                  password_hash = excluded.password_hash,
                  full_name = excluded.full_name,
                  role = excluded.role,
                  email_verified = excluded.email_verified,
                  updated_at = excluded.updated_at
              `).run(newId, cleanEmail, fullName, targetRole, now, now);
              profile = {
                id: newId,
                email: cleanEmail,
                password_hash: "FIREBASE_AUTH",
                full_name: fullName,
                role: targetRole,
              };
            } else if (isAdmin && profile.role !== "admin") {
              db.prepare("UPDATE profiles SET role = 'admin', updated_at = ? WHERE id = ?").run(now, profile.id);
              profile.role = "admin";
            }
          }
        } catch (fbErr) {
          console.error("Firebase auth verification fallback notice:", fbErr);
        }
      }
    }

    if (!profile || !passwordValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

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
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
