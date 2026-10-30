import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initiateCheckout } from "@/lib/payments";
import { PlanSlug } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to upgrade your membership." }, { status: 401 });
    }

    const body = await req.json();
    const { planSlug, phoneNumber } = body;

    if (!planSlug || !["starter", "basic", "pro", "vip"].includes(planSlug)) {
      return NextResponse.json({ error: "Invalid membership plan selected." }, { status: 400 });
    }

    const phone = phoneNumber || user.phone_number || "+254700000000";
    const result = initiateCheckout(user.id, planSlug as PlanSlug, phone);

    if (!result.success || !result.payment) {
      return NextResponse.json({ error: result.error || "Failed to initiate payment." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      instructions: "STK push simulation initiated. Confirm payment callback in sandbox.",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
