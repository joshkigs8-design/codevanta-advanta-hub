import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const { id } = params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(id) as any;
  if (!existing) {
    return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updates: string[] = [];
    const values: any[] = [];

    if (body.is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(body.is_active ? 1 : 0);
    }

    if (body.max_uses !== undefined) {
      const maxUsesInt = Math.max(existing.used_count, parseInt(body.max_uses, 10) || existing.max_uses);
      updates.push("max_uses = ?");
      values.push(maxUsesInt);
    }

    if (body.description !== undefined) {
      updates.push("description = ?");
      values.push(String(body.description).trim());
    }

    if (body.expires_at !== undefined) {
      updates.push("expires_at = ?");
      values.push(body.expires_at || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No changes provided." });
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE promo_codes SET ${updates.join(", ")} WHERE id = ?`).run(...values);

    logAdminAction(
      user.id,
      "update_promocode",
      "promo_code",
      id,
      { changes: body }
    );

    const updated = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(id) as any;
    return NextResponse.json({
      success: true,
      promoCode: {
        ...updated,
        is_active: Boolean(updated.is_active),
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const { id } = params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM promo_codes WHERE id = ?").get(id) as any;
  if (!existing) {
    return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
  }

  try {
    db.prepare("DELETE FROM promo_codes WHERE id = ?").run(id);

    logAdminAction(
      user.id,
      "delete_promocode",
      "promo_code",
      id,
      { code: existing.code }
    );

    return NextResponse.json({ success: true, message: "Promo code deleted successfully." });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
