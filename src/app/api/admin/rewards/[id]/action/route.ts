import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { approveReferralReward, rejectReferralReward, createReferralPayout } from "@/lib/referral";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, reason } = body;

    if (action === "prepare_payout") {
      const payout = createReferralPayout(id);
      if (!payout) return NextResponse.json({ error: "Reward must be approved before preparing a payout." }, { status: 400 });
      logAdminAction(user.id, "prepare_referral_payout", "referral_rewards", id, { payoutId: payout.id });
      return NextResponse.json({ success: true, payout });
    }

    if (action === "approve") {
      const ok = approveReferralReward(id, user.id);
      if (!ok) return NextResponse.json({ error: "Failed to approve reward (must be in pending state)." }, { status: 400 });
      const payout = createReferralPayout(id);
      logAdminAction(user.id, "approve_referral_reward", "referral_rewards", id, {});
      return NextResponse.json({
        success: true,
        payout,
        message: "Reward approved for manual M-Pesa payout. Record the payment only after the transfer succeeds.",
      });
    } else if (action === "reject") {
      if (!reason) {
        return NextResponse.json({ error: "A clear rejection reason is required." }, { status: 400 });
      }
      const ok = rejectReferralReward(id, user.id, reason);
      if (!ok) return NextResponse.json({ error: "Failed to reject reward." }, { status: 400 });
      logAdminAction(user.id, "reject_referral_reward", "referral_rewards", id, { reason });
      return NextResponse.json({ success: true, message: "Reward rejected and pending balance clawed back." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
