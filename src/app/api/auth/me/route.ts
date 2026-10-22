import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserEntitlements } from "@/lib/entitlements";
import { getProgramStatus } from "@/lib/referral";

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null, entitlements: getUserEntitlements(null) });
  }

  const entitlements = getUserEntitlements(user.id);
  const programStatus = getProgramStatus();

  return NextResponse.json({
    authenticated: true,
    user,
    entitlements,
    programStatus,
  });
}
