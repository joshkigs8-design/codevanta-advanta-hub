import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();

    /* ── Recent Users (last 5) ── */
    const recentUsers = db
      .prepare(
        `SELECT id, full_name, email, role, created_at
         FROM profiles
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .all() as Array<{
      id: string;
      full_name: string;
      email: string;
      role: string;
      created_at: string;
    }>;

    /* ── Recent Audit Logs (last 10) — join admin name ── */
    const recentAuditLogs = db
      .prepare(
        `SELECT
           a.id,
           a.admin_user_id,
           a.action,
           a.target_entity,
           a.target_id,
           a.details,
           a.created_at,
           COALESCE(p.full_name, 'System') AS admin_name
         FROM admin_audit_logs a
         LEFT JOIN profiles p ON p.id = a.admin_user_id
         ORDER BY a.created_at DESC
         LIMIT 10`
      )
      .all() as Array<{
      id: string;
      admin_user_id: string;
      action: string;
      target_entity: string;
      target_id: string;
      details: string;
      created_at: string;
      admin_name: string;
    }>;

    /* ── Referral Stats ── */
    const totalCodes = (
      db.prepare(`SELECT COUNT(*) AS count FROM referral_codes`).get() as {
        count: number;
      }
    ).count;

    const totalAttributions = (
      db
        .prepare(`SELECT COUNT(*) AS count FROM referral_attributions`)
        .get() as { count: number }
    ).count;

    const totalRewards = (
      db.prepare(`SELECT COUNT(*) AS count FROM referral_rewards`).get() as {
        count: number;
      }
    ).count;

    const pendingRewards = (
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM referral_rewards WHERE status = 'pending'`
        )
        .get() as { count: number }
    ).count;

    /* ── Additional useful counts ── */
    const totalReferrals = (
      db
        .prepare(`SELECT COUNT(*) AS count FROM referral_attributions`)
        .get() as { count: number }
    ).count;

    return NextResponse.json({
      recentUsers,
      recentAuditLogs,
      referralStats: {
        totalCodes,
        totalAttributions,
        totalRewards,
        pendingRewards,
      },
      totalReferrals,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
