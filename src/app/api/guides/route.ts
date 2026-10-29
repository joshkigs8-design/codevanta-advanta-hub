import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { Tutorial } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";
    const category = searchParams.get("category")?.trim() || "";
    const sort = searchParams.get("sort") || "newest";
    const db = getDb();
    const conditions = ["is_published = 1"];
    const params: string[] = [];
    if (query) {
      conditions.push("(LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(category) LIKE ?)");
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    const order = sort === "title" ? "title ASC" : sort === "time" ? "estimated_minutes ASC" : "featured DESC, last_verified_date DESC, created_at DESC";
    const guides = db.prepare(`SELECT * FROM tutorials WHERE ${conditions.join(" AND ")} ORDER BY ${order}`).all(...params) as Array<Record<string, unknown>>;
    const parse = (value: unknown) => {
      try { return JSON.parse(String(value || "[]")); } catch { return []; }
    };
    const tutorials = guides.map((guide) => ({
      ...guide,
      is_published: Boolean(guide.is_published),
      featured: Boolean(guide.featured),
      prerequisites: parse(guide.prerequisites),
      supported_os: parse(guide.supported_os),
    })) as unknown as Tutorial[];
    const categories = db.prepare(`SELECT DISTINCT category FROM tutorials WHERE is_published = 1 ORDER BY category`).all() as Array<{ category: string }>;

    return NextResponse.json({
      guides: tutorials,
      categories: categories.map((item) => item.category),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
