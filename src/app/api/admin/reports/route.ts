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
    const period = parseInt(searchParams.get("period") || "30", 10);

    const db = getDb();

    // User growth per day (last N days)
    const userGrowth = db.prepare(
      `SELECT substr(created_at, 1, 10) as date, COUNT(*) as count
       FROM profiles
       WHERE created_at >= datetime('now', '-' || ? || ' days')
       GROUP BY substr(created_at, 1, 10)
       ORDER BY date ASC`
    ).all(period);

    // Revenue by plan
    const revenueByPlan = db.prepare(
      `SELECT 
        COALESCE(mp.name, 'Other') as plan_name,
        SUM(p.amount_kes) as total_kes,
        COUNT(p.id) as payment_count
       FROM payments p
       LEFT JOIN membership_plans mp ON mp.id = p.plan_id
       WHERE p.status = 'completed'
       GROUP BY mp.name
       ORDER BY total_kes DESC`
    ).all();

    // Top resources by click count
    const topResources = db.prepare(
      `SELECT r.id, r.name, r.click_count, c.name as category_name
       FROM resources r
       JOIN categories c ON c.id = r.category_id
       ORDER BY r.click_count DESC
       LIMIT 10`
    ).all();

    // Membership distribution
    const membershipDistribution = db.prepare(
      `SELECT 
        plan_name,
        COUNT(*) as count,
        SUM(amount_paid_kes) as total_revenue
       FROM memberships
       WHERE status = 'active'
       GROUP BY plan_name
       ORDER BY count DESC`
    ).all();

    // Referral stats summary
    const referralPerformance = db.prepare(
      `SELECT 
        (SELECT COUNT(*) FROM referral_attributions) as total_attributions,
        (SELECT COUNT(*) FROM referral_rewards WHERE status = 'approved') as approved_rewards,
        (SELECT COALESCE(SUM(reward_amount_kes), 0) FROM referral_rewards WHERE status = 'approved') as total_commissions_paid
      `
    ).get();

    return NextResponse.json({
      userGrowth,
      revenueByPlan,
      topResources,
      membershipDistribution,
      referralPerformance,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

