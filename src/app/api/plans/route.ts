import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { MembershipPlan } from "@/types";

interface RawPlanRow {
  id: string;
  slug: any;
  name: string;
  description: string;
  price_kes: number;
  direct_referral_reward_kes: number;
  billing_cycle: any;
  is_active: number;
  entitlements: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY price_kes ASC").all() as unknown as RawPlanRow[];

    const plans: MembershipPlan[] = rows.map((p) => ({
      ...p,
      is_active: Boolean(p.is_active),
      entitlements: JSON.parse(p.entitlements || "{}"),
    }));

    return NextResponse.json({ plans });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
