import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ReferralReward } from "@/types";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();
    const rewards = db.prepare(`
      SELECT r.*,
             referrer.full_name as referrer_name, referrer.email as referrer_email,
             referred.full_name as referred_name, referred.email as referred_email
      FROM referral_rewards r
      JOIN profiles referrer ON r.referrer_user_id = referrer.id
      JOIN profiles referred ON r.referred_user_id = referred.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `).all() as unknown as Array<
      ReferralReward & {
        referrer_name: string;
        referrer_email: string;
        referred_name: string;
        referred_email: string;
      }
    >;

    return NextResponse.json({ rewards });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
