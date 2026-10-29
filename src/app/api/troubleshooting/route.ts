import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TroubleshootingEntry } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const tool = searchParams.get("tool")?.trim();
    const q = searchParams.get("q")?.trim().toLowerCase();

    const db = getDb();
    let sql = `SELECT * FROM troubleshooting_entries WHERE is_published = 1`;
    const params: unknown[] = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (tool) {
      sql += ` AND affected_tool = ?`;
      params.push(tool);
    }

    if (q) {
      sql += ` AND (
        LOWER(error_message) LIKE ? OR
        LOWER(affected_tool) LIKE ? OR
        LOWER(likely_causes) LIKE ? OR
        LOWER(step_by_step_fix) LIKE ?
      )`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = db.prepare(sql).all(...params) as Array<Record<string, any>>;

    const entries: TroubleshootingEntry[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      error_message: r.error_message,
      affected_tool: r.affected_tool,
      category: r.category,
      likely_causes: r.likely_causes,
      step_by_step_fix: r.step_by_step_fix,
      verification_steps: r.verification_steps,
      official_docs_url: r.official_docs_url,
      last_verified_date: r.last_verified_date,
      is_published: Boolean(r.is_published),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({ entries, total: entries.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
