import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getDb } from "./db";
import { Profile, UserRole } from "@/types";

// Blacklist SHA-256 hashes of historically compromised or default secrets
export const COMPROMISED_SECRET_HASHES = [
  "a220b2d4a1a8c886f7c353017c99a9ffa895dccbcb9c0a6a06574bc4a9d9b373",
  "2b7219e36912f4e3ca7b4fd52fa12b96f93abe0b9461f9778499df1c6ca11fd6",
];

export function isCompromisedSecret(secret: string): boolean {
  const hash = crypto.createHash("sha256").update(secret).digest("hex");
  return COMPROMISED_SECRET_HASHES.includes(hash);
}

export const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "cv_hub_session";
export const JWT_ISSUER = "codevanta-hub";
export const JWT_AUDIENCE = "codevanta-app";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error("SECURITY FAILURE: JWT_SECRET environment variable is missing. A secure random secret is required.");
  }
  if (isCompromisedSecret(secret.trim())) {
    throw new Error("SECURITY FAILURE: The compromised development fallback JWT_SECRET is strictly prohibited in production.");
  }
  if (secret.length < 32) {
    throw new Error("SECURITY FAILURE: JWT_SECRET must be at least 32 characters long for cryptographic integrity.");
  }
  return secret.trim();
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  emailVerified?: boolean;
}

export function signToken(payload: SessionPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: "30d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as any;

    if (!decoded || !decoded.userId || !decoded.role) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      fullName: decoded.fullName,
      emailVerified: Boolean(decoded.emailVerified),
    };
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

  if (!row && session.email && adminEmails.includes(session.email.toLowerCase().trim()) && session.emailVerified) {
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
