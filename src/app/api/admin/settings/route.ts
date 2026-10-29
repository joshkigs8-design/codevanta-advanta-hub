import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const db = getDb();

    // Ensure default settings exist
    const defaults = [
      { key: "site_name", value: "CodeVanta Hub", description: "The public name of the platform" },
      { key: "site_description", value: "Curated Developer Resources & Membership", description: "Meta description and tagline" },
      { key: "referral_program_status", value: "approved_for_launch", description: "Status: disabled, compliance_review, approved_for_launch, suspended" },
      { key: "min_withdrawal_kes", value: "500", description: "Minimum balance required to request a payout in KES" },
      { key: "withdrawal_fee_kes", value: "0", description: "Fee charged per payout withdrawal in KES" },
      { key: "mpesa_configured", value: "false", description: "Whether M-Pesa B2C live credentials are valid and active" },
    ];

    const now = new Date().toISOString();
    for (const d of defaults) {
      db.prepare(`
        INSERT OR IGNORE INTO programme_settings (key, value, description, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(d.key, d.value, d.description, now);
    }

    const settings = db.prepare(`SELECT * FROM programme_settings ORDER BY key ASC`).all();

    return NextResponse.json({ settings });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required." }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE programme_settings SET value = ?, updated_at = ? WHERE key = ?
    `).run(String(value), now, key);

    logAdminAction(session.userId, "update_setting", "programme_settings", key, { value });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

