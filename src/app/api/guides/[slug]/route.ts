import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const parse = (value: unknown) => {
  try { return JSON.parse(String(value || "[]")); } catch { return []; }
};

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const db = getDb();
    const guide = db.prepare(
      `SELECT * FROM tutorials WHERE slug = ? AND is_published = 1`
    ).get(params.slug) as Record<string, unknown> | undefined;
    if (!guide) return NextResponse.json({ error: "Tutorial not found" }, { status: 404 });
    const related = db.prepare(
      `SELECT slug, title, summary, category, estimated_minutes FROM tutorials
       WHERE is_published = 1 AND slug != ? AND category = ?
       ORDER BY featured DESC, last_verified_date DESC LIMIT 3`
    ).all(params.slug, guide.category);
    return NextResponse.json({
      tutorial: {
        ...guide,
        is_published: Boolean(guide.is_published),
        featured: Boolean(guide.featured),
        prerequisites: parse(guide.prerequisites),
        supported_operating_systems: parse(guide.supported_os),
        steps: [],
        references: guide.official_docs_url ? [{ title: "Official documentation", url: guide.official_docs_url }] : [],
        introduction: guide.summary,
      },
      related,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
