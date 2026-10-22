import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWallet } from "@/lib/wallet";
import { getProgramStatus } from "@/lib/referral";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wallet, ledger, withdrawals } = getWallet(user.id);
    const programStatus = getProgramStatus();

    const db = getDb();
    const minSetting = db
      .prepare("SELECT value FROM programme_settings WHERE key = 'minimum_withdrawal_kes'")
      .get() as { value: string } | undefined;
    const feeSetting = db
      .prepare("SELECT value FROM programme_settings WHERE key = 'default_payout_fee_kes'")
      .get() as { value: string } | undefined;

    return NextResponse.json({
      wallet,
      ledger,
      withdrawals,
      programStatus,
      policy: {
        minimumWithdrawalKes: minSetting ? parseFloat(minSetting.value) : 100,
        feeKes: feeSetting ? parseFloat(feeSetting.value) : 0,
        payoutsEnabled: programStatus === "approved_for_launch",
        statusNotice:
          programStatus === "compliance_review"
            ? "Referral programme is in formal Compliance Review mode under Kenyan law. Referral rewards accrue in audited balances, but real-money withdrawals are locked until final legal certification is posted."
            : programStatus === "disabled"
            ? "Referral programme is currently disabled."
            : programStatus === "suspended"
            ? "Referral programme is currently suspended."
            : "Referral payouts are active for verified members.",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
