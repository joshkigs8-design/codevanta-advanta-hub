import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getReferralCodeForUser } from "@/lib/referral";

async function syncFirestoreUsersToLocal(db: any) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return;

    // Use admin credentials to authenticate against Firebase Auth REST API
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "joshkigs8@gmail.com",
          password: "Josh3940.",
          returnSecureToken: true,
        }),
      }
    );
    const signInData = await signInRes.json();
    if (!signInData.idToken) return;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "codevanta-hub";
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`,
      {
        headers: { Authorization: `Bearer ${signInData.idToken}` },
      }
    );
    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return;

    const upsertProfile = db.prepare(`
      INSERT INTO profiles (id, email, password_hash, full_name, role, country, email_verified, created_at, updated_at)
      VALUES (?, ?, 'FIREBASE_AUTH', ?, ?, 'KE', ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        full_name = excluded.full_name,
        role = excluded.role,
        email_verified = excluded.email_verified,
        updated_at = excluded.updated_at
    `);

    const upsertRefCode = db.prepare(`
      INSERT INTO referral_codes (id, user_id, code, clicks, created_at)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(user_id) DO UPDATE SET code = excluded.code
    `);

    const nowIso = new Date().toISOString();
    for (const doc of data.documents) {
      const f = doc.fields || {};
      const email = f.email?.stringValue?.toLowerCase()?.trim();
      if (!email) continue;
      const uid = f.uid?.stringValue || doc.name.split("/").pop();
      const fullName = f.displayName?.stringValue || f.fullName?.stringValue || email.split("@")[0];
      const role = f.role?.stringValue || (email === "joshkigs8@gmail.com" ? "admin" : "user");
      const emailVerified = f.emailVerified?.booleanValue ? 1 : 0;
      const createdAt = f.createdAt?.timestampValue || f.createdAt?.stringValue || nowIso;
      const updatedAt = f.updatedAt?.timestampValue || f.updatedAt?.stringValue || nowIso;

      upsertProfile.run(uid, email, fullName, role, emailVerified, createdAt, updatedAt);

      if (f.referralCode?.stringValue) {
        upsertRefCode.run(`ref-${uid}`, uid, f.referralCode.stringValue, createdAt);
      }
    }
  } catch (err) {
    console.warn("Could not sync Firestore users:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const search = (searchParams.get("search") || "").trim();
    const role = searchParams.get("role") || "";
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") === "asc" ? "ASC" : "DESC";

    const db = getDb();

    // Proactively sync users from Firestore so new accounts (including free accounts) appear immediately
    await syncFirestoreUsersToLocal(db);

    // Whitelist sortable columns
    const allowedSorts: Record<string, string> = {
      created_at: "p.created_at",
      name: "p.full_name",
      email: "p.email",
      role: "p.role",
    };
    const sortColumn = allowedSorts[sort] || "p.created_at";

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(p.full_name LIKE ? OR p.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role && ["user", "member", "admin"].includes(role)) {
      conditions.push("p.role = ?");
      params.push(role);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countRow = db
      .prepare(
        `SELECT COUNT(*) as total FROM profiles p ${whereClause}`
      )
      .get(...params) as { total: number };
    const total = countRow.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    // Fetch users with referral code and latest active membership
    const users = db
      .prepare(
        `SELECT
          p.id, p.email, p.full_name, p.avatar_url, p.role,
          p.phone_number, p.country, p.created_at, p.updated_at,
          rc.code as referral_code,
          m.id as membership_id, m.plan_slug, m.plan_name, m.status as membership_status,
          m.amount_paid_kes, m.starts_at, m.expires_at
        FROM profiles p
        LEFT JOIN referral_codes rc ON rc.user_id = p.id
        LEFT JOIN (
          SELECT user_id, id, plan_slug, plan_name, status, amount_paid_kes, starts_at, expires_at
          FROM memberships
          WHERE status = 'active'
          GROUP BY user_id
        ) m ON m.user_id = p.id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}
        LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Array<Record<string, unknown>>;

    // Shape the response
    const shaped = users.map((u) => {
      const isAdmin = u.role === "admin" || u.email === "joshkigs8@gmail.com";

      let refCode = (u.referral_code as string | undefined) || null;
      if (!refCode && typeof u.id === "string") {
        try {
          const generated = getReferralCodeForUser(u.id);
          if (generated?.code) refCode = generated.code;
        } catch {
          // ignore
        }
      }

      const membership = u.membership_id
        ? {
            id: u.membership_id,
            plan_slug: u.plan_slug,
            plan_name: u.plan_name,
            status: u.membership_status,
            amount_paid_kes: u.amount_paid_kes,
            starts_at: u.starts_at,
            expires_at: u.expires_at,
          }
        : isAdmin
        ? {
            id: "admin-vip-lifetime",
            plan_slug: "vip",
            plan_name: "VIP Tier",
            status: "active",
            amount_paid_kes: 0,
            starts_at: u.created_at,
            expires_at: null,
          }
        : {
            id: "free-plan",
            plan_slug: "free",
            plan_name: "Free Tier",
            status: "active",
            amount_paid_kes: 0,
            starts_at: u.created_at,
            expires_at: null,
          };

      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        role: u.role,
        phone_number: u.phone_number,
        country: u.country,
        referral_code: refCode,
        created_at: u.created_at,
        updated_at: u.updated_at,
        membership,
      };
    });

    return NextResponse.json({
      users: shaped,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
