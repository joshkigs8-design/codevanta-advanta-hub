import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Tutorial } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const db = getDb();

    const row = db
      .prepare(`SELECT * FROM tutorials WHERE slug = ? AND is_published = 1`)
      .get(slug) as Record<string, any> | undefined;

    if (!row) {
      return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    }

    const tutorial: Tutorial = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      category: row.category,
      difficulty: row.difficulty,
      estimated_minutes: row.estimated_minutes,
      prerequisites: JSON.parse(row.prerequisites || "[]"),
      supported_os: JSON.parse(row.supported_os || "[]"),
      content: row.content,
      troubleshooting_notes: row.troubleshooting_notes,
      security_warnings: row.security_warnings,
      official_docs_url: row.official_docs_url,
      last_verified_date: row.last_verified_date,
      is_published: Boolean(row.is_published),
      featured: Boolean(row.featured),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Get related tutorials in the same category
    const relatedRows = db
      .prepare(
        `SELECT id, slug, title, summary, category, difficulty, estimated_minutes
         FROM tutorials
         WHERE category = ? AND id != ? AND is_published = 1
         LIMIT 3`
      )
      .all(tutorial.category, tutorial.id) as Array<Record<string, any>>;

    return NextResponse.json({ tutorial, related: relatedRows });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

