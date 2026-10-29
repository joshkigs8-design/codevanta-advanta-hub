import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Tutorial } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const difficulty = searchParams.get("difficulty")?.trim();
    const q = searchParams.get("q")?.trim().toLowerCase();
    const featured = searchParams.get("featured") === "true";

    const db = getDb();
    let sql = `SELECT * FROM tutorials WHERE is_published = 1`;
    const params: unknown[] = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (difficulty) {
      sql += ` AND difficulty = ?`;
      params.push(difficulty);
    }

    if (featured) {
      sql += ` AND featured = 1`;
    }

    if (q) {
      sql += ` AND (
        LOWER(title) LIKE ? OR
        LOWER(summary) LIKE ? OR
        LOWER(content) LIKE ?
      )`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern);
    }

    sql += ` ORDER BY featured DESC, created_at DESC`;

    const rows = db.prepare(sql).all(...params) as Array<Record<string, any>>;

    const tutorials: Tutorial[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      category: r.category,
      difficulty: r.difficulty,
      estimated_minutes: r.estimated_minutes,
      prerequisites: JSON.parse(r.prerequisites || "[]"),
      supported_os: JSON.parse(r.supported_os || "[]"),
      content: r.content,
      troubleshooting_notes: r.troubleshooting_notes,
      security_warnings: r.security_warnings,
      official_docs_url: r.official_docs_url,
      last_verified_date: r.last_verified_date,
      is_published: Boolean(r.is_published),
      featured: Boolean(r.featured),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({ tutorials, total: tutorials.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

