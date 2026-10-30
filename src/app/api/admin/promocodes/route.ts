import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { PromoCode, PromoCodeRedemption } from "@/types";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const db = getDb();
  try {
    const codes = db
      .prepare("SELECT * FROM promo_codes ORDER BY created_at DESC")
      .all() as PromoCode[];

    const redemptions = db
      .prepare("SELECT * FROM promo_code_redemptions ORDER BY redeemed_at DESC")
      .all() as PromoCodeRedemption[];

    const redemptionsByCode = redemptions.reduce((acc, r) => {
      if (!acc[r.promo_code_id]) acc[r.promo_code_id] = [];
      acc[r.promo_code_id].push(r);
      return acc;
    }, {} as Record<string, PromoCodeRedemption[]>);

    const result = codes.map((c) => ({
      ...c,
      is_active: Boolean(c.is_active),
      redemptions: redemptionsByCode[c.id] || [],
    }));

    return NextResponse.json({ promoCodes: result });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    let { code, description, plan_slug, max_uses, expires_at } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanCode.length < 3) {
      return NextResponse.json({ error: "Promo code must be at least 3 characters long." }, { status: 400 });
    }

    if (!["basic", "pro", "vip"].includes(plan_slug)) {
      plan_slug = "vip";
    }

    const maxUsesInt = Math.max(1, parseInt(max_uses, 10) || 5);
    const now = new Date().toISOString();
    const id = `promo_${crypto.randomUUID()}`;

    const db = getDb();

    // Check duplicate code
    const existing = db.prepare("SELECT id FROM promo_codes WHERE code = ?").get(cleanCode);
    if (existing) {
      return NextResponse.json({ error: `Promo code "${cleanCode}" already exists.` }, { status: 409 });
    }

    db.prepare(`
      INSERT INTO promo_codes (
        id, code, description, plan_slug, max_uses, used_count, is_active, expires_at, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?, ?, ?)
    `).run(
      id,
      cleanCode,
      description?.trim() || "Launchday Promo Access",
      plan_slug,
      maxUsesInt,
      expires_at || null,
      user.id,
      now,
      now
    );

    logAdminAction(
      user.id,
      "create_promocode",
      "promo_code",
      id,
      { code: cleanCode, plan_slug, max_uses: maxUsesInt }
    );

    return NextResponse.json({
      success: true,
      promoCode: {
        id,
        code: cleanCode,
        description: description?.trim() || "Launchday Promo Access",
        plan_slug,
        max_uses: maxUsesInt,
        used_count: 0,
        is_active: true,
        expires_at: expires_at || null,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
