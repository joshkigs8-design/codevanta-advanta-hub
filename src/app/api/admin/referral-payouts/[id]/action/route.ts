import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { recordReferralPayout } from "@/lib/referral";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const mpesaReference = typeof body.mpesaReference === "string" ? body.mpesaReference : "";
    const paidAt = typeof body.paidAt === "string" ? body.paidAt : "";
    const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : undefined;
    if (!mpesaReference.trim() || !paidAt || Number.isNaN(Date.parse(paidAt))) {
      return NextResponse.json({ error: "A valid M-Pesa reference and payment date are required." }, { status: 400 });
    }

    const payout = recordReferralPayout(params.id, user.id, mpesaReference, new Date(paidAt).toISOString(), adminNote);
    if (!payout) {
      return NextResponse.json({ error: "Payout is missing or has already been recorded." }, { status: 409 });
    }

    logAdminAction(user.id, "record_manual_referral_payout", "referral_payouts", params.id, {
      mpesaReference,
      paidAt: payout.paid_at,
      amountKes: payout.amount_kes,
    });
    return NextResponse.json({ success: true, payout });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
