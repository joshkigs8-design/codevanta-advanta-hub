import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();
    const totalUsersRow = db.prepare(`SELECT COUNT(*) as count FROM profiles`).get() as { count: number } | undefined;
    const activeUsersRow = db
      .prepare(`SELECT COUNT(*) as count FROM profiles WHERE created_at >= datetime('now', '-30 days')`)
      .get() as { count: number } | undefined;
    const activeSubsRow = db
      .prepare(`SELECT COUNT(*) as count FROM memberships WHERE status = 'active'`)
      .get() as { count: number } | undefined;
    const totalRevenueRow = db
      .prepare(`SELECT COALESCE(SUM(amount_kes), 0) as sum FROM payments WHERE status = 'completed'`)
      .get() as { sum: number } | undefined;
    const pendingPaymentsRow = db
      .prepare(`SELECT COUNT(*) as count FROM payments WHERE status = 'pending'`)
      .get() as { count: number } | undefined;

    const stats = {
      totalUsers: totalUsersRow?.count || 0,
      activeUsers: activeUsersRow?.count || 0,
      activeSubscriptions: activeSubsRow?.count || 0,
      totalRevenue: totalRevenueRow?.sum || 0,
      pendingPayments: pendingPaymentsRow?.count || 0,
    };
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
