import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

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

    // Whitelist sortable columns
    const allowedSorts: Record<string, string> = {
      created_at: "p.created_at",
      name: "p.full_name",
      email: "p.email",
      role: "p.role",
    };
    const sortColumn = allowedSorts[sort] || "p.created_at";

    const db = getDb();

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

    // Fetch users with latest active membership (grouped to prevent duplicate user rows)
    const users = db
      .prepare(
        `SELECT
          p.id, p.email, p.full_name, p.avatar_url, p.role,
          p.phone_number, p.country, p.created_at, p.updated_at,
          m.id as membership_id, m.plan_slug, m.plan_name, m.status as membership_status,
          m.amount_paid_kes, m.starts_at, m.expires_at
        FROM profiles p
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
    const shaped = users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      role: u.role,
      phone_number: u.phone_number,
      country: u.country,
      created_at: u.created_at,
      updated_at: u.updated_at,
      membership: u.membership_id
        ? {
            id: u.membership_id,
            plan_slug: u.plan_slug,
            plan_name: u.plan_name,
            status: u.membership_status,
            amount_paid_kes: u.amount_paid_kes,
            starts_at: u.starts_at,
            expires_at: u.expires_at,
          }
        : null,
    }));

    return NextResponse.json({
      users: shaped,
      total,
      page,
      totalPages,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
