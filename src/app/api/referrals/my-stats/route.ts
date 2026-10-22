import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReferralCodeForUser, getProgramStatus } from "@/lib/referral";
import { getDb } from "@/lib/db";
import { ReferralReward } from "@/types";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const refCode = getReferralCodeForUser(user.id);
    const programStatus = getProgramStatus();

    // Attributed signups count
    const signupsCount = db
      .prepare("SELECT COUNT(*) as count FROM referral_attributions WHERE referrer_user_id = ?")
      .get(user.id) as { count: number };

    // Qualified purchases count
    const qualifiedCount = db
      .prepare("SELECT COUNT(*) as count FROM referral_attributions WHERE referrer_user_id = ? AND status = 'qualified'")
      .get(user.id) as { count: number };

    // Referral rewards list
    const rewards = db
      .prepare(`
        SELECT r.*, p.full_name as referred_name, p.email as referred_email
        FROM referral_rewards r
        JOIN profiles p ON r.referred_user_id = p.id
        WHERE r.referrer_user_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(user.id) as unknown as Array<ReferralReward & { referred_name: string; referred_email: string }>;

    // Mask referred email for privacy (e.g. j***@domain.com)
    const maskedRewards = rewards.map((r) => {
      const parts = r.referred_email.split("@");
      const maskedEmail = parts[0].slice(0, 2) + "***@" + parts[1];
      return {
        ...r,
        referred_email: maskedEmail,
      };
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const referralUrl = `${appUrl}/register?ref=${refCode?.code || ""}`;

    return NextResponse.json({
      code: refCode?.code,
      referralUrl,
      clicks: refCode?.clicks || 0,
      signupsCount: signupsCount.count,
      qualifiedCount: qualifiedCount.count,
      programStatus,
      rewards: maskedRewards,
      shareMessage: `Check out CodeVanta Advanta Hub — the ultimate developer resource platform for free APIs, AI models, hosting tiers, and blueprints: ${referralUrl}`,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
