import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { WithdrawalRequest } from "@/types";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();
    const withdrawals = db.prepare(`
      SELECT w.*, p.full_name, p.email
      FROM withdrawal_requests w
      JOIN profiles p ON w.user_id = p.id
      ORDER BY w.created_at DESC
      LIMIT 100
    `).all() as unknown as Array<WithdrawalRequest & { full_name: string; email: string }>;

    return NextResponse.json({ withdrawals });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
