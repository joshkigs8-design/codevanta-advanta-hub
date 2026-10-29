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
    const search = (searchParams.get("search") || "").trim();

    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(rc.code LIKE ? OR p.full_name LIKE ? OR p.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRow = db.prepare(
      `SELECT COUNT(*) as total 
       FROM referral_codes rc 
       JOIN profiles p ON p.id = rc.user_id 
       ${whereClause}`
    ).get(...params) as { total: number };

    const total = countRow ? countRow.total : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;

    const referrals = db.prepare(
      `SELECT 
        rc.id, rc.code, rc.clicks, rc.created_at,
        p.id as referrer_id, p.full_name as referrer_name, p.email as referrer_email,
        (SELECT COUNT(*) FROM referral_attributions WHERE referral_code = rc.code) as attribution_count,
        (SELECT COUNT(*) FROM referral_rewards WHERE referrer_user_id = rc.user_id AND status = 'approved') as approved_reward_count,
        (SELECT COUNT(*) FROM referral_rewards WHERE referrer_user_id = rc.user_id AND status = 'pending') as pending_reward_count,
        COALESCE((SELECT SUM(reward_amount_kes) FROM referral_rewards WHERE referrer_user_id = rc.user_id AND status = 'approved'), 0) as total_earned_kes
       FROM referral_codes rc
       JOIN profiles p ON p.id = rc.user_id
       ${whereClause}
       ORDER BY rc.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    // Also get all attributions
    const attributions = db.prepare(
      `SELECT 
        ra.id, ra.referral_code, ra.status, ra.created_at,
        ref.full_name as referrer_name, ref.email as referrer_email,
        usr.full_name as referred_name, usr.email as referred_email
       FROM referral_attributions ra
       JOIN profiles ref ON ref.id = ra.referrer_user_id
       JOIN profiles usr ON usr.id = ra.referred_user_id
       ORDER BY ra.created_at DESC
       LIMIT 50`
    ).all();

    // Also get all rewards
    const rewards = db.prepare(
      `SELECT 
        rr.id, rr.plan_slug, rr.reward_amount_kes, rr.status, rr.rejection_reason, rr.hold_until, rr.created_at,
        ref.full_name as referrer_name, ref.email as referrer_email,
        usr.full_name as referred_name, usr.email as referred_email
       FROM referral_rewards rr
       JOIN profiles ref ON ref.id = rr.referrer_user_id
       JOIN profiles usr ON usr.id = rr.referred_user_id
       ORDER BY rr.created_at DESC
       LIMIT 50`
    ).all();

    return NextResponse.json({
      referrals,
      attributions,
      rewards,
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

