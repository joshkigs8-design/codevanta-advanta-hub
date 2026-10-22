import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import crypto from "node:crypto";
import { VerificationStatus } from "@/types";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, notes, free_tier_details, usage_limits } = body;

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM resources WHERE id = ?")
      .get(id) as { id: string; verification_status: VerificationStatus; name: string } | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const logId = crypto.randomUUID();

    db.exec("BEGIN IMMEDIATE;");
    try {
      db.prepare(`
        UPDATE resources
        SET verification_status = ?, last_verification_date = ?,
            free_tier_details = COALESCE(?, free_tier_details),
            usage_limits = COALESCE(?, usage_limits),
            updated_at = ?
        WHERE id = ?
      `).run(status || existing.verification_status, today, free_tier_details || null, usage_limits || null, now, id);

      db.prepare(`
        INSERT INTO verification_logs (id, resource_id, verified_by, previous_status, new_status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(logId, id, user.id, existing.verification_status, status, notes || "Routine editorial verification", now);

      db.exec("COMMIT;");

      logAdminAction(user.id, "verify_resource", "resources", id, {
        previous_status: existing.verification_status,
        new_status: status,
        notes,
      });

      return NextResponse.json({ success: true, message: "Verification log recorded." });
    } catch (e) {
      db.exec("ROLLBACK;");
      throw e;
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
