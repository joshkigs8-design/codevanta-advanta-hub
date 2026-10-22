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

    const db = getDb();
    const profile = db
      .prepare("SELECT * FROM profiles WHERE email = ?")
      .get(email.toLowerCase().trim()) as {
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: "user" | "member" | "admin";
      } | undefined;

    if (!profile) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const passwordValid = bcrypt.compareSync(password, profile.password_hash);
    if (!passwordValid) {
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
