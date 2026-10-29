import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const action = searchParams.get("action") || "";

    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (action) {
      conditions.push("l.action = ?");
      params.push(action);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db.prepare(
      `SELECT COUNT(*) as total FROM admin_audit_logs l ${whereClause}`
    ).get(...params) as { total: number };

    const total = countRow ? countRow.total : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const logs = db.prepare(
      `SELECT 
        l.id, l.admin_user_id, l.action, l.target_entity, l.target_id,
        l.details, l.ip_address, l.created_at,
        p.full_name as admin_name, p.email as admin_email
       FROM admin_audit_logs l
       LEFT JOIN profiles p ON p.id = l.admin_user_id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    return NextResponse.json({
      logs,
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

