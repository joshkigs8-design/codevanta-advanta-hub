import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processWithdrawalRequest } from "@/lib/wallet";
import { logAdminAction } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, externalTransactionId, notes } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'." }, { status: 400 });
    }

    const result = processWithdrawalRequest(id, user.id, action, externalTransactionId, notes);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logAdminAction(user.id, `${action}_withdrawal`, "withdrawal_requests", id, {
      externalTransactionId,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Withdrawal approved and marked paid." : "Withdrawal rejected and balance restored.",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
