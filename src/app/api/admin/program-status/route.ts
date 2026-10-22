import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setProgramStatus, getProgramStatus } from "@/lib/referral";
import { logAdminAction } from "@/lib/audit";
import { ReferralProgramStatus } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const { status, legalReviewerNotes } = body;

    const validStatuses: ReferralProgramStatus[] = ["disabled", "compliance_review", "approved_for_launch", "suspended"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid referral program status." }, { status: 400 });
    }

    if (status === "approved_for_launch" && !legalReviewerNotes) {
      return NextResponse.json(
        { error: "Legal review certification details (counsel name and advocate roll number) are mandatory before approving launch." },
        { status: 400 }
      );
    }

    const previousStatus = getProgramStatus();
    setProgramStatus(status as ReferralProgramStatus, user.id, legalReviewerNotes);

    logAdminAction(user.id, "update_referral_program_status", "programme_settings", "referral_program_status", {
      previousStatus,
      newStatus: status,
      legalReviewerNotes,
    });

    return NextResponse.json({
      success: true,
      status,
      message: `Referral programme status transitioned to ${status}.`,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
