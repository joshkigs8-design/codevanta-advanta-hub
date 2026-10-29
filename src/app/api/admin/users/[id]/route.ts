import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import type { Profile, UserRole } from "@/types";

interface RouteParams {
  params: { id: string };
}

// GET /api/admin/users/[id] — Full user details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = getCurrentUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = params;
    const db = getDb();

    // Profile
    const profile = db
      .prepare(
        `SELECT id, email, full_name, avatar_url, role, phone_number, country, created_at, updated_at
         FROM profiles WHERE id = ?`
      )
      .get(id) as Profile | undefined;

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Active membership
    const membership = db
      .prepare(
        `SELECT id, plan_id, plan_slug, plan_name, status, amount_paid_kes,
                starts_at, expires_at, payment_reference, created_at
         FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
      )
      .get(id) as Record<string, unknown> | undefined;

    // Referral code + stats
    const referralCode = db
      .prepare(`SELECT id, code, clicks, created_at FROM referral_codes WHERE user_id = ?`)
      .get(id) as Record<string, unknown> | undefined;

    let referralStats = { totalReferrals: 0, qualifiedReferrals: 0, totalEarned: 0 };
    if (referralCode) {
      const stats = db
        .prepare(
          `SELECT
            COUNT(*) as total_referrals,
            SUM(CASE WHEN ra.status = 'qualified' THEN 1 ELSE 0 END) as qualified_referrals
           FROM referral_attributions ra
           WHERE ra.referrer_user_id = ?`
        )
        .get(id) as { total_referrals: number; qualified_referrals: number };

      const earningsRow = db
        .prepare(
          `SELECT COALESCE(SUM(reward_amount_kes), 0) as total_earned
           FROM referral_rewards WHERE referrer_user_id = ? AND status IN ('approved', 'pending')`
        )
        .get(id) as { total_earned: number };

      referralStats = {
        totalReferrals: stats.total_referrals,
        qualifiedReferrals: stats.qualified_referrals,
        totalEarned: earningsRow.total_earned,
      };
    }

    // Wallet balance
    const wallet = db
      .prepare(
        `SELECT id, pending_balance, approved_balance, withdrawn_balance
         FROM wallet_accounts WHERE user_id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;

    // Recent payments (last 5)
    const recentPayments = db
      .prepare(
        `SELECT p.id, p.amount_kes, p.currency, p.provider, p.status, p.created_at,
                mp.name as plan_name
         FROM payments p
         LEFT JOIN membership_plans mp ON p.plan_id = mp.id
         WHERE p.user_id = ?
         ORDER BY p.created_at DESC
         LIMIT 5`
      )
      .all(id) as Array<Record<string, unknown>>;

    return NextResponse.json({
      profile,
      membership: membership || null,
      referralCode: referralCode || null,
      referralStats,
      wallet: wallet || null,
      recentPayments,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] — Update user role
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = getCurrentUser();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { role } = body as { role?: string };

    const validRoles: UserRole[] = ["user", "member", "admin"];
    if (!role || !validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: user, member, admin" },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (id === admin.id && role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get current user
    const target = db
      .prepare("SELECT id, role FROM profiles WHERE id = ?")
      .get(id) as { id: string; role: string } | undefined;

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousRole = target.role;
    if (previousRole === role) {
      return NextResponse.json({ message: "Role unchanged", role });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE profiles SET role = ?, updated_at = ? WHERE id = ?").run(
      role,
      now,
      id
    );

    // Audit log
    logAdminAction(admin.id, "change_user_role", "profiles", id, {
      previous_role: previousRole,
      new_role: role,
    });

    return NextResponse.json({
      success: true,
      message: `Role changed from ${previousRole} to ${role}`,
      role,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
