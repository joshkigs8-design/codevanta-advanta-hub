import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncFirestoreUsersToLocal } from "@/lib/firestoreSync";
import { verifyFirebaseIdToken } from "@/lib/verifyFirebaseToken";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    const session = getSession();
    let isAuthorized = Boolean(session && session.role === "admin");

    if (!isAuthorized && bearerToken) {
      const verified = await verifyFirebaseIdToken(bearerToken);
      const adminEmails = [
        "joshkigs8@gmail.com",
        (process.env.ADMIN_DEFAULT_EMAIL || "").toLowerCase().trim(),
      ].filter(Boolean);
      if (verified && adminEmails.includes(verified.email.toLowerCase())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();

    // Proactively sync users from Firestore if token is available
    if (bearerToken) {
      await syncFirestoreUsersToLocal(db, bearerToken);
    }

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
