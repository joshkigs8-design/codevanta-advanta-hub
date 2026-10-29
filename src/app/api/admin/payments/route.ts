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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || "";
    const provider = searchParams.get("provider") || "";
    const search = (searchParams.get("search") || "").trim();

    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      conditions.push("py.status = ?");
      params.push(status);
    }
    if (provider) {
      conditions.push("py.provider = ?");
      params.push(provider);
    }
    if (search) {
      conditions.push("(p.email LIKE ? OR p.full_name LIKE ? OR py.provider_reference LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db.prepare(
      `SELECT COUNT(*) as total 
       FROM payments py 
       JOIN profiles p ON p.id = py.user_id 
       ${whereClause}`
    ).get(...params) as { total: number };

    const total = countRow ? countRow.total : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const payments = db.prepare(
      `SELECT 
        py.id, py.user_id, py.plan_id, py.amount_kes, py.currency, py.provider,
        py.provider_reference, py.status, py.created_at, py.updated_at,
        p.full_name as user_name, p.email as user_email,
        mp.name as plan_name, mp.slug as plan_slug
       FROM payments py
       JOIN profiles p ON p.id = py.user_id
       LEFT JOIN membership_plans mp ON mp.id = py.plan_id
       ${whereClause}
       ORDER BY py.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    // Also get withdrawal requests
    const withdrawals = db.prepare(
      `SELECT 
        w.id, w.user_id, w.amount_kes, w.fee_kes, w.net_amount_kes,
        w.phone_number, w.account_name, w.payment_method, w.status,
        w.external_transaction_id, w.admin_notes, w.rejection_reason,
        w.created_at, w.updated_at,
        p.full_name as user_name, p.email as user_email
       FROM withdrawal_requests w
       JOIN profiles p ON p.id = w.user_id
       ORDER BY w.created_at DESC
       LIMIT 50`
    ).all();

    // Stats summary
    const statsRow = db.prepare(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_kes ELSE 0 END), 0) as completed_volume,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
       FROM payments`
    ).get() as { total_count: number; completed_volume: number; pending_count: number; failed_count: number };

    return NextResponse.json({
      payments,
      withdrawals,
      stats: statsRow,
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

