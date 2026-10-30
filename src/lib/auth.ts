import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { Profile, UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "codevanta-advanta-hub-development-jwt-secret-min-32-chars";
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "cv_hub_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  emailVerified?: boolean;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSession(): SessionPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getCurrentUser(): Profile | null {
  const session = getSession();
  if (!session) return null;

  const db = getDb();
  let row = db
    .prepare("SELECT id, email, full_name, avatar_url, role, phone_number, country, email_verified, created_at, updated_at FROM profiles WHERE id = ?")
    .get(session.userId) as any;

  if (!row && session.email) {
    row = db
      .prepare("SELECT id, email, full_name, avatar_url, role, phone_number, country, email_verified, created_at, updated_at FROM profiles WHERE email = ?")
      .get(session.email.toLowerCase().trim()) as any;
  }

  const adminEmails = [
    "joshkigs8@gmail.com",
    (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim(),
  ].filter(Boolean);

  if (!row && session.email && adminEmails.includes(session.email.toLowerCase().trim())) {
    const now = new Date().toISOString();
    const id = session.userId || "00000000-0000-4000-a000-000000000001";
    db.prepare(`
      INSERT OR REPLACE INTO profiles (id, email, password_hash, full_name, role, country, email_verified, created_at, updated_at)
      VALUES (?, ?, 'ADMIN_SESSION', ?, 'admin', 'KE', 1, ?, ?)
    `).run(id, session.email.toLowerCase().trim(), session.fullName || "Admin", now, now);

    row = db
      .prepare("SELECT id, email, full_name, avatar_url, role, phone_number, country, email_verified, created_at, updated_at FROM profiles WHERE id = ?")
      .get(id) as any;
  }

  if (!row) return null;

  return {
    ...row,
    email_verified: Boolean(row.email_verified),
  };
}

export function requireAuth(): Profile {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required");
  }
  return user;
}

export function requireAdmin(): Profile {
  const user = requireAuth();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN: Administrative privileges required");
  }
  return user;
}
