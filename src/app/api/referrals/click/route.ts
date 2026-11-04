import { NextRequest, NextResponse } from "next/server";
import { recordReferralClick } from "@/lib/referral";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || !/^CV[A-Z0-9]{4,10}$/i.test(code)) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const success = recordReferralClick(code);
  return NextResponse.json({ success, code });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = (body.code || "").trim().toUpperCase();

    if (!code || !/^CV[A-Z0-9]{4,10}$/i.test(code)) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    }

    const success = recordReferralClick(code);
    return NextResponse.json({ success, code });
  } catch {
    return NextResponse.json({ error: "Failed to record click" }, { status: 500 });
  }
}

