import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitWithdrawalRequest } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.email_verified && user.role !== "admin") {
      return NextResponse.json(
        { error: "Email verification is required before requesting payouts. Please verify your email address to unlock withdrawals." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, phoneNumber, accountName, paymentMethod } = body;

    const amountKes = parseFloat(amount);
    if (isNaN(amountKes) || amountKes <= 0) {
      return NextResponse.json({ error: "Please enter a valid withdrawal amount." }, { status: 400 });
    }

    if (!phoneNumber || !accountName) {
      return NextResponse.json({ error: "M-Pesa phone number and account name are required for disbursement." }, { status: 400 });
    }

    const result = submitWithdrawalRequest(
      user.id,
      amountKes,
      phoneNumber.trim(),
      accountName.trim(),
      paymentMethod || "mpesa_b2c"
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully.",
      request: result.request,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
