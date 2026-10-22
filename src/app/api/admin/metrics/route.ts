import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getProgramStatus } from "@/lib/referral";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();

    // 1. Users count
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM profiles").get() as { count: number };
    const memberUsers = db.prepare("SELECT COUNT(*) as count FROM profiles WHERE role = 'member'").get() as { count: number };

    // 2. Active memberships
    const activeMemberships = db.prepare("SELECT COUNT(*) as count FROM memberships WHERE status = 'active'").get() as { count: number };
    const membershipsByTier = db.prepare(`
      SELECT plan_slug, COUNT(*) as count, SUM(amount_paid_kes) as total_revenue
      FROM memberships
      WHERE status = 'active'
      GROUP BY plan_slug
    `).all() as unknown as Array<{ plan_slug: string; count: number; total_revenue: number }>;

    // 3. Total revenue from completed payments
    const revenueRow = db.prepare("SELECT COALESCE(SUM(amount_kes), 0) as total FROM payments WHERE status = 'completed'").get() as { total: number };

    // 4. Resources metrics
    const totalResources = db.prepare("SELECT COUNT(*) as count FROM resources WHERE verification_status != 'archived'").get() as { count: number };
    const verifiedResources = db.prepare("SELECT COUNT(*) as count FROM resources WHERE verification_status = 'verified'").get() as { count: number };
    const staleResources = db.prepare("SELECT COUNT(*) as count FROM resources WHERE verification_status = 'stale'").get() as { count: number };

    // 5. Referral & Wallet metrics
    const pendingRewards = db.prepare("SELECT COALESCE(SUM(reward_amount_kes), 0) as total, COUNT(*) as count FROM referral_rewards WHERE status = 'pending'").get() as { total: number; count: number };
    const approvedRewards = db.prepare("SELECT COALESCE(SUM(reward_amount_kes), 0) as total, COUNT(*) as count FROM referral_rewards WHERE status = 'approved'").get() as { total: number; count: number };
    const walletObligations = db.prepare("SELECT COALESCE(SUM(approved_balance), 0) as total FROM wallet_accounts").get() as { total: number };

    // 6. Withdrawal requests
    const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount_kes), 0) as total FROM withdrawal_requests WHERE status = 'submitted'").get() as { count: number; total: number };

    // 7. Recent admin audit logs
    const recentAuditLogs = db.prepare(`
      SELECT l.*, p.email as admin_email
      FROM admin_audit_logs l
      JOIN profiles p ON l.admin_user_id = p.id
      ORDER BY l.created_at DESC
      LIMIT 10
    `).all();

    const programStatus = getProgramStatus();

    return NextResponse.json({
      users: {
        total: totalUsers.count,
        members: memberUsers.count,
      },
      memberships: {
        active: activeMemberships.count,
        byTier: membershipsByTier,
        totalRevenueKes: revenueRow.total,
      },
      resources: {
        total: totalResources.count,
        verified: verifiedResources.count,
        stale: staleResources.count,
      },
      referrals: {
        pendingRewardsCount: pendingRewards.count,
        pendingRewardsTotalKes: pendingRewards.total,
        approvedRewardsCount: approvedRewards.count,
        approvedRewardsTotalKes: approvedRewards.total,
        outstandingWalletLiabilityKes: walletObligations.total,
      },
      withdrawals: {
        pendingCount: pendingWithdrawals.count,
        pendingTotalKes: pendingWithdrawals.total,
      },
      programStatus,
      recentAuditLogs,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
